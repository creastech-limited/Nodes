const axios = require('axios');
const Recipient = require('../Models/recipient');
const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET_KEY;

const headers = {
  Authorization: `Bearer ${PAYSTACK_SECRET}`,
  'Content-Type': 'application/json'
};

// Digits-only validation
function isDigitsOnly(value) {
  return /^\d+$/.test(value);
}

// Create or retrieve a recipient
const getOrCreateRecipient = async (accountNumber, bankCode, name = 'Withdrawal Recipient') => {
  const existing = await Recipient.findOne({ account_number: accountNumber, bank_code: bankCode });
  console.log('Checking existing recipient:', existing);

  if (existing) return existing.recipient_code;

  const res = await axios.post(
    'https://api.paystack.co/transferrecipient',
    {
      type: 'nuban',
      name,
      account_number: accountNumber,
      bank_code: bankCode,
      currency: 'NGN'
    },
    { headers }
  );

  const recipientCode = res.data.data.recipient_code;

  // Cache recipient in DB
  await Recipient.create({
    account_number: accountNumber,
    bank_code: bankCode,
    recipient_code: recipientCode
  });

  return recipientCode;
};

// Initiate transfer
const initiateTransfer = async ({ amount, recipientCode, reason = 'Withdrawal' }) => {
  const response = await axios.post(
    'https://api.paystack.co/transfer',
    {
      source: 'balance',
      reason,
      amount,
      recipient: recipientCode
    },
    { headers }
  );

  return response.data;
};

module.exports = {
  isDigitsOnly,
  getOrCreateRecipient,
  initiateTransfer
};
