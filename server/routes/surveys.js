const express = require('express');
const { pool } = require('../config/database');
const { asyncHandler } = require('../middleware/errorHandler');

const router = express.Router();

// Get available surveys for user
router.get('/', asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const offset = (page - 1) * limit;

  // Get surveys that user hasn't completed yet
  const result = await pool.query(
    `SELECT s.id, s.title, s.description, s.reward_amount, s.estimated_time, s.current_completions, s.max_completions
     FROM surveys s
     WHERE s.is_active = true 
     AND (s.max_completions IS NULL OR s.current_completions < s.max_completions)
     AND s.id NOT IN (
       SELECT survey_id FROM survey_completions WHERE user_id = $1
     )
     ORDER BY s.reward_amount DESC, s.created_at DESC
     LIMIT $2 OFFSET $3`,
    [req.user.id, limit, offset]
  );

  const countResult = await pool.query(
    `SELECT COUNT(*) 
     FROM surveys s
     WHERE s.is_active = true 
     AND (s.max_completions IS NULL OR s.current_completions < s.max_completions)
     AND s.id NOT IN (
       SELECT survey_id FROM survey_completions WHERE user_id = $1
     )`,
    [req.user.id]
  );

  const surveys = result.rows.map(row => ({
    id: row.id,
    title: row.title,
    description: row.description,
    rewardAmount: parseFloat(row.reward_amount),
    estimatedTime: row.estimated_time,
    currentCompletions: row.current_completions,
    maxCompletions: row.max_completions,
    spotsRemaining: row.max_completions ? row.max_completions - row.current_completions : null
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

// Get survey details and questions
router.get('/:id', asyncHandler(async (req, res) => {
  const surveyId = parseInt(req.params.id);

  // Check if survey exists and is available
  const surveyResult = await pool.query(
    `SELECT s.*, 
            CASE WHEN sc.user_id IS NOT NULL THEN true ELSE false END as completed_by_user
     FROM surveys s
     LEFT JOIN survey_completions sc ON s.id = sc.survey_id AND sc.user_id = $2
     WHERE s.id = $1`,
    [surveyId, req.user.id]
  );

  if (surveyResult.rows.length === 0) {
    return res.status(404).json({ error: 'Survey not found' });
  }

  const survey = surveyResult.rows[0];

  if (!survey.is_active) {
    return res.status(400).json({ error: 'Survey is no longer active' });
  }

  if (survey.completed_by_user) {
    return res.status(400).json({ error: 'You have already completed this survey' });
  }

  if (survey.max_completions && survey.current_completions >= survey.max_completions) {
    return res.status(400).json({ error: 'Survey has reached maximum completions' });
  }

  res.json({
    id: survey.id,
    title: survey.title,
    description: survey.description,
    rewardAmount: parseFloat(survey.reward_amount),
    estimatedTime: survey.estimated_time,
    questions: survey.questions,
    currentCompletions: survey.current_completions,
    maxCompletions: survey.max_completions
  });
}));

// Start a survey (track that user has started it)
router.post('/:id/start', asyncHandler(async (req, res) => {
  const surveyId = parseInt(req.params.id);

  // Verify survey is available (same checks as get survey details)
  const surveyResult = await pool.query(
    `SELECT s.*, 
            CASE WHEN sc.user_id IS NOT NULL THEN true ELSE false END as completed_by_user
     FROM surveys s
     LEFT JOIN survey_completions sc ON s.id = sc.survey_id AND sc.user_id = $2
     WHERE s.id = $1`,
    [surveyId, req.user.id]
  );

  if (surveyResult.rows.length === 0) {
    return res.status(404).json({ error: 'Survey not found' });
  }

  const survey = surveyResult.rows[0];

  if (!survey.is_active) {
    return res.status(400).json({ error: 'Survey is no longer active' });
  }

  if (survey.completed_by_user) {
    return res.status(400).json({ error: 'You have already completed this survey' });
  }

  if (survey.max_completions && survey.current_completions >= survey.max_completions) {
    return res.status(400).json({ error: 'Survey has reached maximum completions' });
  }

  res.json({
    message: 'Survey started successfully',
    surveyId: survey.id,
    startedAt: new Date().toISOString()
  });
}));

// Submit survey answers
router.post('/:id/submit', asyncHandler(async (req, res) => {
  const surveyId = parseInt(req.params.id);
  const { answers } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;

  if (!answers || typeof answers !== 'object') {
    return res.status(400).json({ error: 'Survey answers are required' });
  }

  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Verify survey is still available
    const surveyResult = await client.query(
      `SELECT s.*, 
              CASE WHEN sc.user_id IS NOT NULL THEN true ELSE false END as completed_by_user
       FROM surveys s
       LEFT JOIN survey_completions sc ON s.id = sc.survey_id AND sc.user_id = $2
       WHERE s.id = $1`,
      [surveyId, req.user.id]
    );

    if (surveyResult.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Survey not found' });
    }

    const survey = surveyResult.rows[0];

    if (!survey.is_active) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Survey is no longer active' });
    }

    if (survey.completed_by_user) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'You have already completed this survey' });
    }

    if (survey.max_completions && survey.current_completions >= survey.max_completions) {
      await client.query('ROLLBACK');
      return res.status(400).json({ error: 'Survey has reached maximum completions' });
    }

    // Validate answers against survey questions
    const questions = survey.questions;
    const requiredQuestions = questions.filter(q => q.required);
    
    for (const question of requiredQuestions) {
      if (!answers[question.id]) {
        await client.query('ROLLBACK');
        return res.status(400).json({ 
          error: `Answer required for question: ${question.text}` 
        });
      }
    }

    // Record survey completion
    await client.query(
      `INSERT INTO survey_completions (user_id, survey_id, answers, reward_earned, ip_address)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.user.id, surveyId, JSON.stringify(answers), survey.reward_amount, ipAddress]
    );

    // Update survey completion count
    await client.query(
      'UPDATE surveys SET current_completions = current_completions + 1 WHERE id = $1',
      [surveyId]
    );

    // Update user earnings
    await client.query(
      `UPDATE users 
       SET total_earnings = total_earnings + $1, 
           available_balance = available_balance + $1
       WHERE id = $2`,
      [survey.reward_amount, req.user.id]
    );

    // Record earnings history
    await client.query(
      `INSERT INTO earnings_history (user_id, type, amount, description, reference_id)
       VALUES ($1, 'survey', $2, $3, $4)`,
      [req.user.id, survey.reward_amount, `Completed survey: ${survey.title}`, surveyId]
    );

    await client.query('COMMIT');

    res.json({
      message: 'Survey completed successfully!',
      rewardEarned: parseFloat(survey.reward_amount),
      surveyTitle: survey.title
    });

  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}));

// Get survey categories/stats (for dashboard)
router.get('/stats/overview', asyncHandler(async (req, res) => {
  // Get total available surveys for user
  const availableResult = await pool.query(
    `SELECT COUNT(*) as available_surveys
     FROM surveys s
     WHERE s.is_active = true 
     AND (s.max_completions IS NULL OR s.current_completions < s.max_completions)
     AND s.id NOT IN (
       SELECT survey_id FROM survey_completions WHERE user_id = $1
     )`,
    [req.user.id]
  );

  // Get user's completion stats
  const completedResult = await pool.query(
    'SELECT COUNT(*) as completed_surveys FROM survey_completions WHERE user_id = $1',
    [req.user.id]
  );

  // Get average reward for available surveys
  const avgRewardResult = await pool.query(
    `SELECT AVG(reward_amount) as avg_reward
     FROM surveys s
     WHERE s.is_active = true 
     AND (s.max_completions IS NULL OR s.current_completions < s.max_completions)
     AND s.id NOT IN (
       SELECT survey_id FROM survey_completions WHERE user_id = $1
     )`,
    [req.user.id]
  );

  res.json({
    availableSurveys: parseInt(availableResult.rows[0].available_surveys),
    completedSurveys: parseInt(completedResult.rows[0].completed_surveys),
    averageReward: parseFloat(avgRewardResult.rows[0].avg_reward) || 0
  });
}));

module.exports = router;
