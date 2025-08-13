const { body, validationResult } = require('express-validator');

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      error: 'Validation failed',
      details: errors.array()
    });
  }
  next();
};

const registerValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('Password must contain at least one lowercase letter, one uppercase letter, and one number'),
  body('firstName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('First name must be between 2 and 50 characters'),
  body('lastName')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Last name must be between 2 and 50 characters'),
  body('captchaToken')
    .notEmpty()
    .withMessage('CAPTCHA verification is required'),
  handleValidationErrors
];

const loginValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .notEmpty()
    .withMessage('Password is required'),
  body('captchaToken')
    .notEmpty()
    .withMessage('CAPTCHA verification is required'),
  handleValidationErrors
];

const surveyValidation = [
  body('title')
    .trim()
    .isLength({ min: 5, max: 255 })
    .withMessage('Title must be between 5 and 255 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('rewardAmount')
    .isFloat({ min: 0.01, max: 1000 })
    .withMessage('Reward amount must be between $0.01 and $1000'),
  body('estimatedTime')
    .isInt({ min: 1, max: 120 })
    .withMessage('Estimated time must be between 1 and 120 minutes'),
  body('questions')
    .isArray({ min: 1 })
    .withMessage('At least one question is required'),
  handleValidationErrors
];

const MINIMUM_WITHDRAWAL = parseFloat(process.env.MINIMUM_WITHDRAWAL) || 5.00;

const withdrawalValidation = [
  body('amount')
    .isFloat({ min: MINIMUM_WITHDRAWAL })
    .withMessage(`Minimum withdrawal amount is $${MINIMUM_WITHDRAWAL.toFixed(2)}`),
  body('method')
    .isIn(['paypal', 'stripe'])
    .withMessage('Payment method must be either paypal or stripe'),
  body('paymentDetails')
    .isObject()
    .withMessage('Payment details are required'),
  handleValidationErrors
];

module.exports = {
  registerValidation,
  loginValidation,
  surveyValidation,
  withdrawalValidation,
  handleValidationErrors
};
