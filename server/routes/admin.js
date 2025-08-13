const express = require('express');
const { pool } = require('../config/database');
const { requireAdmin } = require('../middleware/auth');
const { surveyValidation } = require('../utils/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { processPayPalPayout, processStripePayout } = require('../services/paymentService');

const router = express.Router();

// Apply admin middleware to all routes
router.use(requireAdmin);

// Dashboard stats
router.get('/dashboard', asyncHandler(async (req, res) => {
  // Get total users
  const usersResult = await pool.query('SELECT COUNT(*) as total_users FROM users WHERE is_verified = true');
  
  // Get total surveys
  const surveysResult = await pool.query('SELECT COUNT(*) as total_surveys FROM surveys');
  
  // Get active surveys
  const activeSurveysResult = await pool.query('SELECT COUNT(*) as active_surveys FROM surveys WHERE is_active = true');
  
  // Get total earnings paid out
  const earningsResult = await pool.query('SELECT COALESCE(SUM(total_earnings), 0) as total_earnings FROM users');
  
  // Get pending withdrawals
  const pendingWithdrawalsResult = await pool.query(
    'SELECT COUNT(*) as pending_count, COALESCE(SUM(amount), 0) as pending_amount FROM withdrawal_requests WHERE status = $1',
    ['pending']
  );
  
  // Get survey completions this month
  const completionsResult = await pool.query(
    `SELECT COUNT(*) as monthly_completions 
     FROM survey_completions 
     WHERE completed_at >= DATE_TRUNC('month', CURRENT_DATE)`
  );

  // Get new users this month
  const newUsersResult = await pool.query(
    `SELECT COUNT(*) as new_users 
     FROM users 
     WHERE created_at >= DATE_TRUNC('month', CURRENT_DATE) AND is_verified = true`
  );

  res.json({
    totalUsers: parseInt(usersResult.rows[0].total_users),
    totalSurveys: parseInt(surveysResult.rows[0].total_surveys),
    activeSurveys: parseInt(activeSurveysResult.rows[0].active_surveys),
    totalEarnings: parseFloat(earningsResult.rows[0].total_earnings),
    pendingWithdrawals: {
      count: parseInt(pendingWithdrawalsResult.rows[0].pending_count),
      amount: parseFloat(pendingWithdrawalsResult.rows[0].pending_amount)
    },
    monthlyCompletions: parseInt(completionsResult.rows[0].monthly_completions),
    newUsersThisMonth: parseInt(newUsersResult.rows[0].new_users)
  });
}));

// User Management
router.get('/users', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const search = req.query.search || '';

  let query = `
    SELECT u.id, u.email, u.first_name, u.last_name, u.role, u.is_verified,
           u.total_earnings, u.available_balance, u.total_withdrawn,
           u.created_at, u.last_login, u.ip_address,
           COUNT(sc.id) as completed_surveys
    FROM users u
    LEFT JOIN survey_completions sc ON u.id = sc.user_id
  `;
  
  let countQuery = 'SELECT COUNT(*) FROM users u';
  let params = [limit, offset];
  let countParams = [];

  if (search) {
    query += ` WHERE (u.email ILIKE $3 OR u.first_name ILIKE $3 OR u.last_name ILIKE $3)`;
    countQuery += ` WHERE (u.email ILIKE $1 OR u.first_name ILIKE $1 OR u.last_name ILIKE $1)`;
    params.push(`%${search}%`);
    countParams.push(`%${search}%`);
  }

  query += ` GROUP BY u.id ORDER BY u.created_at DESC LIMIT $1 OFFSET $2`;

  const result = await pool.query(query, params);
  const countResult = await pool.query(countQuery, countParams);

  const users = result.rows.map(row => ({
    id: row.id,
    email: row.email,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role,
    isVerified: row.is_verified,
    totalEarnings: parseFloat(row.total_earnings),
    availableBalance: parseFloat(row.available_balance),
    totalWithdrawn: parseFloat(row.total_withdrawn),
    completedSurveys: parseInt(row.completed_surveys),
    createdAt: row.created_at,
    lastLogin: row.last_login,
    ipAddress: row.ip_address
  }));

  res.json({
    users,
    pagination: {
      page,
      limit,
      total: parseInt(countResult.rows[0].count),
      pages: Math.ceil(countResult.rows[0].count / limit)
    }
  });
}));

// Get specific user details
router.get('/users/:id', asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.id);

  const userResult = await pool.query(
    `SELECT u.*, COUNT(sc.id) as completed_surveys
     FROM users u
     LEFT JOIN survey_completions sc ON u.id = sc.user_id
     WHERE u.id = $1
     GROUP BY u.id`,
    [userId]
  );

  if (userResult.rows.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = userResult.rows[0];

  // Get recent survey completions
  const recentSurveysResult = await pool.query(
    `SELECT sc.*, s.title, s.reward_amount
     FROM survey_completions sc
     JOIN surveys s ON sc.survey_id = s.id
     WHERE sc.user_id = $1
     ORDER BY sc.completed_at DESC
     LIMIT 10`,
    [userId]
  );

  // Get withdrawal history
  const withdrawalsResult = await pool.query(
    'SELECT * FROM withdrawal_requests WHERE user_id = $1 ORDER BY created_at DESC LIMIT 10',
    [userId]
  );

  res.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      isVerified: user.is_verified,
      totalEarnings: parseFloat(user.total_earnings),
      availableBalance: parseFloat(user.available_balance),
      totalWithdrawn: parseFloat(user.total_withdrawn),
      completedSurveys: parseInt(user.completed_surveys),
      createdAt: user.created_at,
      lastLogin: user.last_login,
      ipAddress: user.ip_address
    },
    recentSurveys: recentSurveysResult.rows.map(row => ({
      id: row.id,
      surveyTitle: row.title,
      rewardEarned: parseFloat(row.reward_earned),
      completedAt: row.completed_at
    })),
    withdrawalHistory: withdrawalsResult.rows.map(row => ({
      id: row.id,
      amount: parseFloat(row.amount),
      method: row.method,
      status: row.status,
      createdAt: row.created_at
    }))
  });
}));

// Update user role
router.put('/users/:id/role', asyncHandler(async (req, res) => {
  const userId = parseInt(req.params.id);
  const { role } = req.body;

  if (!['user', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role. Must be "user" or "admin"' });
  }

  await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, userId]);

  res.json({ message: 'User role updated successfully' });
}));

// Survey Management
router.get('/surveys', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const result = await pool.query(
    `SELECT s.*, u.first_name, u.last_name
     FROM surveys s
     LEFT JOIN users u ON s.created_by = u.id
     ORDER BY s.created_at DESC
     LIMIT $1 OFFSET $2`,
    [limit, offset]
  );

  const countResult = await pool.query('SELECT COUNT(*) FROM surveys');

  const surveys = result.rows.map(row => ({
    id: row.id,
    title: row.title,
    description: row.description,
    rewardAmount: parseFloat(row.reward_amount),
    estimatedTime: row.estimated_time,
    isActive: row.is_active,
    maxCompletions: row.max_completions,
    currentCompletions: row.current_completions,
    createdBy: row.first_name ? `${row.first_name} ${row.last_name}` : 'System',
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));

  res.json({
    surveys,
    pagination: {
      page,
      limit,
      total: parseInt(countResult.rows[0].count),
      pages: Math.ceil(countResult.rows[0].count / limit)
    }
  });
}));

// Get specific survey
router.get('/surveys/:id', asyncHandler(async (req, res) => {
  const surveyId = parseInt(req.params.id);

  const result = await pool.query(
    `SELECT s.*, u.first_name, u.last_name
     FROM surveys s
     LEFT JOIN users u ON s.created_by = u.id
     WHERE s.id = $1`,
    [surveyId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Survey not found' });
  }

  const survey = result.rows[0];

  res.json({
    id: survey.id,
    title: survey.title,
    description: survey.description,
    rewardAmount: parseFloat(survey.reward_amount),
    estimatedTime: survey.estimated_time,
    questions: survey.questions,
    isActive: survey.is_active,
    maxCompletions: survey.max_completions,
    currentCompletions: survey.current_completions,
    createdBy: survey.first_name ? `${survey.first_name} ${survey.last_name}` : 'System',
    createdAt: survey.created_at,
    updatedAt: survey.updated_at
  });
}));

// Create new survey
router.post('/surveys', surveyValidation, asyncHandler(async (req, res) => {
  const { title, description, rewardAmount, estimatedTime, questions, maxCompletions } = req.body;

  const result = await pool.query(
    `INSERT INTO surveys (title, description, reward_amount, estimated_time, questions, max_completions, created_by)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING id`,
    [title, description, rewardAmount, estimatedTime, JSON.stringify(questions), maxCompletions || null, req.user.id]
  );

  res.status(201).json({
    message: 'Survey created successfully',
    surveyId: result.rows[0].id
  });
}));

// Update survey status (toggle active/inactive)
router.put('/surveys/:id/status', asyncHandler(async (req, res) => {
  const surveyId = parseInt(req.params.id);
  const { isActive } = req.body;

  const result = await pool.query(
    'UPDATE surveys SET is_active = $1 WHERE id = $2 RETURNING id',
    [isActive, surveyId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Survey not found' });
  }

  res.json({ message: `Survey ${isActive ? 'activated' : 'deactivated'} successfully` });
}));

// Update survey
router.put('/surveys/:id', surveyValidation, asyncHandler(async (req, res) => {
  const surveyId = parseInt(req.params.id);
  const { title, description, rewardAmount, estimatedTime, questions, maxCompletions, isActive } = req.body;

  const result = await pool.query(
    `UPDATE surveys 
     SET title = $1, description = $2, reward_amount = $3, estimated_time = $4, 
         questions = $5, max_completions = $6, is_active = $7
     WHERE id = $8
     RETURNING id`,
    [title, description, rewardAmount, estimatedTime, JSON.stringify(questions), maxCompletions || null, isActive !== undefined ? isActive : true, surveyId]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Survey not found' });
  }

  res.json({ message: 'Survey updated successfully' });
}));

// Delete survey
router.delete('/surveys/:id', asyncHandler(async (req, res) => {
  const surveyId = parseInt(req.params.id);

  // Check if survey has completions
  const completionsResult = await pool.query(
    'SELECT COUNT(*) FROM survey_completions WHERE survey_id = $1',
    [surveyId]
  );

  if (parseInt(completionsResult.rows[0].count) > 0) {
    return res.status(400).json({ 
      error: 'Cannot delete survey with existing completions. Consider deactivating it instead.' 
    });
  }

  const result = await pool.query('DELETE FROM surveys WHERE id = $1 RETURNING id', [surveyId]);

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'Survey not found' });
  }

  res.json({ message: 'Survey deleted successfully' });
}));

// Withdrawal Management
router.get('/withdrawals', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;
  const status = req.query.status || '';

  let query = `
    SELECT wr.*, u.first_name, u.last_name, u.email,
           p.first_name as processed_by_first_name, p.last_name as processed_by_last_name
    FROM withdrawal_requests wr
    JOIN users u ON wr.user_id = u.id
    LEFT JOIN users p ON wr.processed_by = p.id
  `;
  
  let countQuery = 'SELECT COUNT(*) FROM withdrawal_requests wr';
  let params = [limit, offset];
  let countParams = [];

  if (status) {
    query += ' WHERE wr.status = $3';
    countQuery += ' WHERE status = $1';
    params.push(status);
    countParams.push(status);
  }

  query += ' ORDER BY wr.created_at DESC LIMIT $1 OFFSET $2';

  const result = await pool.query(query, params);
  const countResult = await pool.query(countQuery, countParams);

  const withdrawals = result.rows.map(row => ({
    id: row.id,
    amount: parseFloat(row.amount),
    method: row.method,
    paymentDetails: row.payment_details,
    status: row.status,
    adminNotes: row.admin_notes,
    user: {
      id: row.user_id,
      name: `${row.first_name} ${row.last_name}`,
      email: row.email
    },
    processedBy: row.processed_by_first_name ? `${row.processed_by_first_name} ${row.processed_by_last_name}` : null,
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

// Approve/Reject withdrawal
router.put('/withdrawals/:id', asyncHandler(async (req, res) => {
  const withdrawalId = parseInt(req.params.id);
  const { action, adminNotes } = req.body; // action: 'approve' or 'reject'

  if (!['approve', 'reject'].includes(action)) {
    return res.status(400).json({ error: 'Action must be "approve" or "reject"' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Get withdrawal details
    const withdrawalResult = await client.query(
      `SELECT wr.*, u.first_name, u.last_name, u.email
       FROM withdrawal_requests wr
       JOIN users u ON wr.user_id = u.id
       WHERE wr.id = $1 AND wr.status = 'pending'`,
      [withdrawalId]
    );

    if (withdrawalResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Pending withdrawal request not found' });
    }

    const withdrawal = withdrawalResult.rows[0];

    if (action === 'approve') {
      // Process payment
      let paymentResult;
      const paymentDetails = withdrawal.payment_details;

      if (withdrawal.method === 'paypal') {
        paymentResult = await processPayPalPayout(
          withdrawalId,
          paymentDetails.email,
          parseFloat(withdrawal.amount)
        );
      } else if (withdrawal.method === 'stripe') {
        // TODO: Stripe payouts require user's connected account ID
        // For now, we'll simulate success but this needs proper implementation
        // paymentResult = await processStripePayout(withdrawalId, accountId, parseFloat(withdrawal.amount));
        console.warn(`Stripe payout attempted for withdrawal ${withdrawalId} but not implemented - requires Stripe Connect setup`);
        paymentResult = { 
          success: false, 
          error: 'Stripe payouts not fully implemented - requires connected account setup' 
        };
      }

      if (paymentResult.success) {
        // Update withdrawal as completed
        await client.query(
          `UPDATE withdrawal_requests 
           SET status = 'completed', admin_notes = $1, processed_by = $2, processed_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [adminNotes || 'Payment processed successfully', req.user.id, withdrawalId]
        );

        // Update user's total withdrawn
        await client.query(
          'UPDATE users SET total_withdrawn = total_withdrawn + $1 WHERE id = $2',
          [withdrawal.amount, withdrawal.user_id]
        );
      } else {
        // Payment failed, update status and refund balance
        await client.query(
          `UPDATE withdrawal_requests 
           SET status = 'rejected', admin_notes = $1, processed_by = $2, processed_at = CURRENT_TIMESTAMP
           WHERE id = $3`,
          [`Payment failed: ${paymentResult.error}`, req.user.id, withdrawalId]
        );

        await client.query(
          'UPDATE users SET available_balance = available_balance + $1 WHERE id = $2',
          [withdrawal.amount, withdrawal.user_id]
        );
      }
    } else {
      // Reject withdrawal
      await client.query(
        `UPDATE withdrawal_requests 
         SET status = 'rejected', admin_notes = $1, processed_by = $2, processed_at = CURRENT_TIMESTAMP
         WHERE id = $3`,
        [adminNotes || 'Withdrawal rejected by admin', req.user.id, withdrawalId]
      );

      // Refund amount to user's available balance
      await client.query(
        'UPDATE users SET available_balance = available_balance + $1 WHERE id = $2',
        [withdrawal.amount, withdrawal.user_id]
      );
    }

    await client.query('COMMIT');

    res.json({ 
      message: `Withdrawal ${action}d successfully`,
      status: action === 'approve' ? 'completed' : 'rejected'
    });

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

module.exports = router;
