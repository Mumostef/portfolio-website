// Application constants
const MINIMUM_WITHDRAWAL = parseFloat(process.env.MINIMUM_WITHDRAWAL) || 5.00;
const WITHDRAWAL_FEE_PERCENTAGE = parseFloat(process.env.WITHDRAWAL_FEE_PERCENTAGE) || 0.02;
const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS) || 12;
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

module.exports = {
  MINIMUM_WITHDRAWAL,
  WITHDRAWAL_FEE_PERCENTAGE,
  BCRYPT_ROUNDS,
  JWT_EXPIRES_IN
};
