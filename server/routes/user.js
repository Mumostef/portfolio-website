const express = require('express');
const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Get user profile
router.get('/profile', asyncHandler(async (req, res) => {
  const result = await pool.query(
    `SELECT id, email, first_name, last_name, total_earnings, available_balance, 
            total_withdrawn, created_at, last_login
     FROM users WHERE id = $1`,
    [req.user.id]
  );

  if (result.rows.length === 0) {
    return res.status(404).json({ error: 'User not found' });
  }

  const user = result.rows[0];
  
  // Get survey completion stats
  const statsResult = await pool.query(
    'SELECT COUNT(*) as completed_surveys FROM survey_completions WHERE user_id = $1',
    [req.user.id]
  );

  res.json({
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      totalEarnings: parseFloat(user.total_earnings),
      availableBalance: parseFloat(user.available_balance),
      totalWithdrawn: parseFloat(user.total_withdrawn),
      completedSurveys: parseInt(statsResult.rows[0].completed_surveys),
      memberSince: user.created_at,
      lastLogin: user.last_login
    }
  });
}));

// Update user profile
router.put('/profile', asyncHandler(async (req, res) => {
  const { firstName, lastName } = req.body;

  if (!firstName || !lastName) {
    return res.status(400).json({ error: 'First name and last name are required' });
  }

  if (firstName.length < 2 || firstName.length > 50 || lastName.length < 2 || lastName.length > 50) {
    return res.status(400).json({ error: 'Names must be between 2 and 50 characters' });
  }

  await pool.query(
    'UPDATE users SET first_name = $1, last_name = $2 WHERE id = $3',
    [firstName.trim(), lastName.trim(), req.user.id]
  );

  res.json({ message: 'Profile updated successfully' });
}));

// Get user earnings history
router.get('/earnings', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const result = await pool.query(
    `SELECT eh.*, s.title as survey_title
     FROM earnings_history eh
     LEFT JOIN surveys s ON eh.reference_id = s.id AND eh.type = 'survey'
     WHERE eh.user_id = $1
     ORDER BY eh.created_at DESC
     LIMIT $2 OFFSET $3`,
    [req.user.id, limit, offset]
  );

  const countResult = await pool.query(
    'SELECT COUNT(*) FROM earnings_history WHERE user_id = $1',
    [req.user.id]
  );

  const earnings = result.rows.map(row => ({
    id: row.id,
    type: row.type,
    amount: parseFloat(row.amount),
    description: row.description,
    surveyTitle: row.survey_title,
    createdAt: row.created_at
  }));

  res.json({
    earnings,
    pagination: {
      page,
      limit,
      total: parseInt(countResult.rows[0].count),
      pages: Math.ceil(countResult.rows[0].count / limit)
    }
  });
}));

// Get user's completed surveys
router.get('/surveys', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 20;
  const offset = (page - 1) * limit;

  const result = await pool.query(
    `SELECT sc.*, s.title, s.description
     FROM survey_completions sc
     JOIN surveys s ON sc.survey_id = s.id
     WHERE sc.user_id = $1
     ORDER BY sc.completed_at DESC
     LIMIT $2 OFFSET $3`,
    [req.user.id, limit, offset]
  );

  const countResult = await pool.query(
    'SELECT COUNT(*) FROM survey_completions WHERE user_id = $1',
    [req.user.id]
  );

  const surveys = result.rows.map(row => ({
    id: row.id,
    surveyId: row.survey_id,
    title: row.title,
    description: row.description,
    rewardEarned: parseFloat(row.reward_earned),
    completedAt: row.completed_at
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

// Get dashboard stats
router.get('/dashboard', asyncHandler(async (req, res) => {
  // Get user stats
  const userResult = await pool.query(
    'SELECT total_earnings, available_balance, total_withdrawn FROM users WHERE id = $1',
    [req.user.id]
  );

  // Get survey completion count
  const surveyCountResult = await pool.query(
    'SELECT COUNT(*) as completed_surveys FROM survey_completions WHERE user_id = $1',
    [req.user.id]
  );

  // Get recent earnings (last 7 days)
  const recentEarningsResult = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) as recent_earnings
     FROM earnings_history 
     WHERE user_id = $1 AND created_at >= CURRENT_DATE - INTERVAL '7 days'`,
    [req.user.id]
  );

  // Get pending withdrawals
  const pendingWithdrawalsResult = await pool.query(
    `SELECT COALESCE(SUM(amount), 0) as pending_amount
     FROM withdrawal_requests 
     WHERE user_id = $1 AND status = 'pending'`,
    [req.user.id]
  );

  const user = userResult.rows[0];

  res.json({
    totalEarnings: parseFloat(user.total_earnings),
    availableBalance: parseFloat(user.available_balance),
    totalWithdrawn: parseFloat(user.total_withdrawn),
    completedSurveys: parseInt(surveyCountResult.rows[0].completed_surveys),
    recentEarnings: parseFloat(recentEarningsResult.rows[0].recent_earnings),
    pendingWithdrawals: parseFloat(pendingWithdrawalsResult.rows[0].pending_amount)
  });
}));

module.exports = router;
