const https = require('https');
const Recipient = require('../Models/recipient');
const {regUser} = require('../Models/registeration'); // Assuming you have a user model
const axios = require('axios');

const PAYSTACK_SECRET = process.env.PAYSTACK_SECRET;

const headers = {
  Authorization: `Bearer ${PAYSTACK_SECRET}`,
  'Content-Type': 'application/json'
};

// Validate digit-only
function isDigitsOnly(value) {
  return /^\d+$/.test(value);
}

// Create or retrieve recipient
const getOrCreateRecipient = async (accountNumber, bankCode, name = 'Withdrawal Recipient') => {
  const existing = await Recipient.findOne({ accountNumber, bankCode });

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

  // Cache in DB
  await Recipient.create({ accountNumber, bankCode, recipientCode });

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







// // utils/paystack.js
// const https = require('https');

// const createRecipient = ({ name, account_number, bank_code, currency = 'NGN' }) => {
//   return new Promise((resolve, reject) => {
//     const params = JSON.stringify({
//       type: 'nuban',
//       name,
//       account_number,
//       bank_code,
//       currency
//     });

//     const options = {
//       hostname: 'api.paystack.co',
//       port: 443,
//       path: '/transferrecipient',
//       method: 'POST',
//       headers: {
//         Authorization: 'Bearer YOUR_SECRET_KEY', // Replace with ENV in production
//         'Content-Type': 'application/json'
//       }
//     };

//     const req = https.request(options, res => {
//       let data = '';
//       res.on('data', chunk => data += chunk);
//       res.on('end', () => {
//         const result = JSON.parse(data);
//         result.status
//           ? resolve(result.data.recipient_code)
//           : reject(result.message || 'Recipient creation failed');
//       });
//     });

//     req.on('error', error => reject(error));
//     req.write(params);
//     req.end();
//   });
// };

// module.exports = { createRecipient };
