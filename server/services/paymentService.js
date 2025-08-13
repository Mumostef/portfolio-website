const paypal = require('@paypal/payouts-sdk');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// PayPal configuration
const environment = process.env.PAYPAL_MODE === 'live' 
  ? new paypal.core.LiveEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET)
  : new paypal.core.SandboxEnvironment(process.env.PAYPAL_CLIENT_ID, process.env.PAYPAL_CLIENT_SECRET);

const paypalClient = new paypal.core.PayPalHttpClient(environment);

// Process PayPal payout
const processPayPalPayout = async (withdrawalId, email, amount, currency = 'USD') => {
  try {
    const request = new paypal.payouts.PayoutsPostRequest();
    request.requestBody({
      sender_batch_header: {
        sender_batch_id: `withdrawal_${withdrawalId}_${Date.now()}`,
        email_subject: 'Survey Platform Payout',
        email_message: 'You have received a payout from Survey Platform. Thanks for using our service!'
      },
      items: [{
        recipient_type: 'EMAIL',
        amount: {
          value: amount.toFixed(2),
          currency: currency
        },
        receiver: email,
        note: `Survey Platform withdrawal #${withdrawalId}`,
        sender_item_id: `withdrawal_${withdrawalId}`
      }]
    });

    const response = await paypalClient.execute(request);
    
    return {
      success: true,
      transactionId: response.result.batch_header.payout_batch_id,
      status: response.result.batch_header.batch_status,
      details: response.result
    };
  } catch (error) {
    console.error('PayPal payout error:', error);
    return {
      success: false,
      error: error.message,
      details: error
    };
  }
};

// Process Stripe payout (requires Stripe Connect)
const processStripePayout = async (withdrawalId, accountId, amount, currency = 'usd') => {
  try {
    // Convert amount to cents for Stripe
    const amountInCents = Math.round(amount * 100);

    const transfer = await stripe.transfers.create({
      amount: amountInCents,
      currency: currency,
      destination: accountId,
      description: `Survey Platform withdrawal #${withdrawalId}`
    });

    return {
      success: true,
      transactionId: transfer.id,
      status: 'completed',
      details: transfer
    };
  } catch (error) {
    console.error('Stripe payout error:', error);
    return {
      success: false,
      error: error.message,
      details: error
    };
  }
};

// Create Stripe Express account for user (for future use)
const createStripeExpressAccount = async (email, firstName, lastName) => {
  try {
    const account = await stripe.accounts.create({
      type: 'express',
      email: email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true }
      },
      business_profile: {
        product_description: 'Survey Platform earnings'
      },
      individual: {
        first_name: firstName,
        last_name: lastName,
        email: email
      }
    });

    return {
      success: true,
      accountId: account.id,
      details: account
    };
  } catch (error) {
    console.error('Stripe account creation error:', error);
    return {
      success: false,
      error: error.message,
      details: error
    };
  }
};

// Verify PayPal email exists (basic check)
const verifyPayPalEmail = async (email) => {
  // This is a basic validation - in production you might want to use PayPal's API
  // to verify the email exists and can receive payments
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

module.exports = {
  processPayPalPayout,
  processStripePayout,
  createStripeExpressAccount,
  verifyPayPalEmail
};
