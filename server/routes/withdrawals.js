const express = require('express');
const { pool } = require('../config/database');
const { withdrawalValidation } = require('../utils/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { sendWithdrawalNotificationEmail } = require('../services/emailService');
const { processPayPalPayout } = require('../services/paymentService');
const { processStripePayout } = require('../services/paymentService');

const router = express.Router();

const { MINIMUM_WITHDRAWAL } = require('../config/constants');

// Get user's withdrawal history
router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const result = await pool.query(
    `SELECT wr.*, u.first_name, u.last_name
     FROM withdrawal_requests wr
     LEFT JOIN users u ON wr.processed_by = u.id
     WHERE wr.user_id = $1
     ORDER BY wr.created_at DESC
     LIMIT $2 OFFSET $3`,
    [req.user.id, limit, offset]
  );

  const countResult = await pool.query(
    'SELECT COUNT(*) FROM withdrawal_requests WHERE user_id = $1',
    [req.user.id]
  );

  const withdrawals = result.rows.map(row => ({
    id: row.id,
    amount: parseFloat(row.amount),
    method: row.method,
    status: row.status,
    adminNotes: row.admin_notes,
    processedBy: row.processed_by ? `${row.first_name} ${row.last_name}` : null,
    processedAt: row.processed_at,
    createdAt: row.created_at
  }));

  res.json({
    withdrawals,
    pagination: {
      page,
      limit,
      total: parseInt(countResult.rows[0].count),
      pages: Math.ceil(countResult.rows[0].count / limit)
    }
  });
}));

// Request withdrawal
router.post('/', withdrawalValidation, asyncHandler(async (req, res) => {
  const { amount, method, paymentDetails } = req.body;

  // Check user's available balance
  const userResult = await pool.query(
    'SELECT available_balance, first_name, last_name, email FROM users WHERE id = $1',
    [req.user.id]
  );

  const user = userResult.rows[0];
  const availableBalance = parseFloat(user.available_balance);

  if (amount > availableBalance) {
    return res.status(400).json({ 
      error: 'Insufficient balance',
      availableBalance: availableBalance
    });
  }

  if (amount < MINIMUM_WITHDRAWAL) {
    return res.status(400).json({ 
      error: `Minimum withdrawal amount is $${MINIMUM_WITHDRAWAL}` 
    });
  }

  // Validate payment details based on method
  if (method === 'paypal') {
    if (!paymentDetails.email) {
      return res.status(400).json({ error: 'PayPal email is required' });
    }
    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(paymentDetails.email)) {
      return res.status(400).json({ error: 'Invalid PayPal email address' });
    }
  } else if (method === 'stripe') {
    if (!paymentDetails.cardLast4 || !paymentDetails.cardType) {
      return res.status(400).json({ error: 'Card details are required for credit card withdrawals' });
    }
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Check for pending withdrawals
    const pendingResult = await client.query(
      'SELECT COUNT(*) FROM withdrawal_requests WHERE user_id = $1 AND status = $2',
      [req.user.id, 'pending']
    );

    if (parseInt(pendingResult.rows[0].count) > 0) {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'You have a pending withdrawal request. Please wait for it to be processed.' 
      });
    }

    // Deduct amount from available balance
    await client.query(
      'UPDATE users SET available_balance = available_balance - $1 WHERE id = $2',
      [amount, req.user.id]
    );

    // Create withdrawal request
    const withdrawalResult = await client.query(
      `INSERT INTO withdrawal_requests (user_id, amount, method, payment_details)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [req.user.id, amount, method, JSON.stringify(paymentDetails)]
    );

    await client.query('COMMIT');

    // Send notification email
    try {
      await sendWithdrawalNotificationEmail(
        user.email, 
        amount, 
        method, 
        `${user.first_name} ${user.last_name}`
      );
    } catch (error) {
      console.error('Failed to send withdrawal notification email:', error);
    }

    res.json({
      message: 'Withdrawal request submitted successfully',
      withdrawalId: withdrawalResult.rows[0].id,
      amount: amount,
      method: method,
      status: 'pending'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

// Get withdrawal limits and info
router.get('/info', asyncHandler(async (req, res) => {
  const userResult = await pool.query(
    'SELECT available_balance FROM users WHERE id = $1',
    [req.user.id]
  );

  const availableBalance = parseFloat(userResult.rows[0].available_balance);

  // Check for pending withdrawals
  const pendingResult = await pool.query(
    'SELECT SUM(amount) as pending_amount FROM withdrawal_requests WHERE user_id = $1 AND status = $2',
    [req.user.id, 'pending']
  );

  const pendingAmount = parseFloat(pendingResult.rows[0].pending_amount) || 0;

  res.json({
    availableBalance: availableBalance,
    pendingAmount: pendingAmount,
    minimumWithdrawal: MINIMUM_WITHDRAWAL,
    supportedMethods: ['paypal', 'stripe'],
    processingTime: '1-3 business days',
    fees: {
      paypal: '2% processing fee',
      stripe: '2% processing fee'
    }
  });
}));

// Cancel pending withdrawal (if status is still pending)
router.delete('/:id', asyncHandler(async (req, res) => {
  const withdrawalId = parseInt(req.params.id);

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get withdrawal details
    const withdrawalResult = await client.query(
      'SELECT amount, status FROM withdrawal_requests WHERE id = $1 AND user_id = $2',
      [withdrawalId, req.user.id]
    );

    if (withdrawalResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Withdrawal request not found' });
    }

    const withdrawal = withdrawalResult.rows[0];

    if (withdrawal.status !== 'pending') {
      await client.query('ROLLBACK');
      return res.status(400).json({ 
        error: 'Can only cancel pending withdrawal requests' 
      });
    }

    // Delete withdrawal request
    await client.query(
      'DELETE FROM withdrawal_requests WHERE id = $1',
      [withdrawalId]
    );

    // Refund amount to user's available balance
    await client.query(
      'UPDATE users SET available_balance = available_balance + $1 WHERE id = $2',
      [withdrawal.amount, req.user.id]
    );

    await client.query('COMMIT');

    res.json({ message: 'Withdrawal request cancelled successfully' });

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

module.exports = router;
