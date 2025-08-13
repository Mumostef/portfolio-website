const axios = require('axios');

const verifyCaptcha = async (token) => {
  if (!token) {
    return false;
  }

  try {
    const response = await axios.post('https://www.google.com/recaptcha/api/siteverify', null, {
      params: {
        secret: process.env.RECAPTCHA_SECRET_KEY,
        response: token
      }
    });

    return response.data.success;
  } catch (error) {
    console.error('CAPTCHA verification error:', error);
    return false;
  }
};

module.exports = {
  verifyCaptcha
};
