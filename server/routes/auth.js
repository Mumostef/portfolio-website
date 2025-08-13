const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { pool } = require('../config/database');
const { sendVerificationEmail, sendPasswordResetEmail } = require('../services/emailService');
const { registerValidation, loginValidation } = require('../utils/validation');
const { asyncHandler } = require('../middleware/errorHandler');
const { verifyCaptcha } = require('../services/captchaService');

const router = express.Router();

// Register new user
router.post('/register', registerValidation, asyncHandler(async (req, res) => {
  const { email, password, firstName, lastName, captchaToken } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;

  // Verify CAPTCHA
  const captchaValid = await verifyCaptcha(captchaToken);
  if (!captchaValid) {
    return res.status(400).json({ error: 'CAPTCHA verification failed' });
  }

  // Check if user already exists
  const existingUser = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
  if (existingUser.rows.length > 0) {
    return res.status(409).json({ error: 'User already exists with this email' });
  }

  // Hash password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Generate verification token
  const verificationToken = crypto.randomBytes(32).toString('hex');

  // Create user
  const result = await pool.query(
    `INSERT INTO users (email, password, first_name, last_name, verification_token, ip_address)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, email, first_name, last_name`,
    [email, hashedPassword, firstName, lastName, verificationToken, ipAddress]
  );

  const user = result.rows[0];

  // Send verification email
  try {
    await sendVerificationEmail(email, verificationToken, `${firstName} ${lastName}`);
  } catch (error) {
    console.error('Failed to send verification email:', error);
    // Don't fail registration if email fails
  }

  res.status(201).json({
    message: 'User registered successfully. Please check your email to verify your account.',
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name
    }
  });
}));

// Verify email
router.post('/verify-email', asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    return res.status(400).json({ error: 'Verification token is required' });
  }

  const result = await pool.query(
    'SELECT id, email, first_name, last_name FROM users WHERE verification_token = $1',
    [token]
  );

  if (result.rows.length === 0) {
    return res.status(400).json({ error: 'Invalid or expired verification token' });
  }

  // Update user as verified
  await pool.query(
    'UPDATE users SET is_verified = true, verification_token = NULL WHERE id = $1',
    [result.rows[0].id]
  );

  res.json({ message: 'Email verified successfully. You can now log in.' });
}));

// Login user
router.post('/login', loginValidation, asyncHandler(async (req, res) => {
  const { email, password, captchaToken } = req.body;
  const ipAddress = req.ip || req.connection.remoteAddress;

  // Verify CAPTCHA
  const captchaValid = await verifyCaptcha(captchaToken);
  if (!captchaValid) {
    return res.status(400).json({ error: 'CAPTCHA verification failed' });
  }

  // Find user
  const result = await pool.query(
    'SELECT id, email, password, first_name, last_name, role, is_verified FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const user = result.rows[0];

  // Check if email is verified
  if (!user.is_verified) {
    return res.status(401).json({ error: 'Please verify your email before logging in' });
  }

  // Verify password
  const passwordValid = await bcrypt.compare(password, user.password);
  if (!passwordValid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  // Update last login and IP
  await pool.query(
    'UPDATE users SET last_login = CURRENT_TIMESTAMP, ip_address = $1 WHERE id = $2',
    [ipAddress, user.id]
  );

  // Generate JWT token
  const token = jwt.sign(
    { userId: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );

  res.json({
    message: 'Login successful',
    token,
    user: {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role
    }
  });
}));

// Forgot password
router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const result = await pool.query(
    'SELECT id, first_name, last_name FROM users WHERE email = $1 AND is_verified = true',
    [email]
  );

  // Always return success to prevent email enumeration
  if (result.rows.length === 0) {
    return res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
  }

  const user = result.rows[0];
  const resetToken = crypto.randomBytes(32).toString('hex');
  const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour

  // Save reset token
  await pool.query(
    'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
    [resetToken, resetTokenExpires, user.id]
  );

  // Send reset email
  try {
    await sendPasswordResetEmail(email, resetToken, `${user.first_name} ${user.last_name}`);
  } catch (error) {
    console.error('Failed to send password reset email:', error);
  }

  res.json({ message: 'If an account with that email exists, a password reset link has been sent.' });
}));

// Reset password
router.post('/reset-password', asyncHandler(async (req, res) => {
  const { token, password } = req.body;

  if (!token || !password) {
    return res.status(400).json({ error: 'Token and password are required' });
  }

  if (password.length < 8) {
    return res.status(400).json({ error: 'Password must be at least 8 characters long' });
  }

  const result = await pool.query(
    'SELECT id FROM users WHERE reset_token = $1 AND reset_token_expires > CURRENT_TIMESTAMP',
    [token]
  );

  if (result.rows.length === 0) {
    return res.status(400).json({ error: 'Invalid or expired reset token' });
  }

  const userId = result.rows[0].id;

  // Hash new password
  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Update password and clear reset token
  await pool.query(
    'UPDATE users SET password = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
    [hashedPassword, userId]
  );

  res.json({ message: 'Password reset successfully. You can now log in with your new password.' });
}));

// Resend verification email
router.post('/resend-verification', asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ error: 'Email is required' });
  }

  const result = await pool.query(
    'SELECT id, first_name, last_name, verification_token, is_verified FROM users WHERE email = $1',
    [email]
  );

  if (result.rows.length === 0) {
    return res.json({ message: 'If an account with that email exists and is unverified, a verification email has been sent.' });
  }

  const user = result.rows[0];

  if (user.is_verified) {
    return res.status(400).json({ error: 'Account is already verified' });
  }

  // Generate new verification token if needed
  let verificationToken = user.verification_token;
  if (!verificationToken) {
    verificationToken = crypto.randomBytes(32).toString('hex');
    await pool.query(
      'UPDATE users SET verification_token = $1 WHERE id = $2',
      [verificationToken, user.id]
    );
  }

  // Send verification email
  try {
    await sendVerificationEmail(email, verificationToken, `${user.first_name} ${user.last_name}`);
  } catch (error) {
    console.error('Failed to send verification email:', error);
  }

  res.json({ message: 'If an account with that email exists and is unverified, a verification email has been sent.' });
}));

module.exports = router;
