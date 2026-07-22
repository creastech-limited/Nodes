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
  // console.log('Checking existing recipient:', existing);

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



const paystack = axios.create({
    baseURL: "https://api.paystack.co",
    headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET}`,
        "Content-Type": "application/json",
    },
});

/**
 * Creates a Paystack customer and assigns a dedicated virtual account
 */
const createPaystackAccount = async ({
    firstName,
    lastName,
    email,
    phone,
}) => {
    try {
        // Step 1 - Create Customer
        const customerResponse = await paystack.post("/customer", {
            first_name: firstName,
            last_name: lastName,
            email,
            phone,
        });

        const customer = customerResponse.data.data;
        console.log("Paystack customer created:", customer);

        // Step 2 - Create Dedicated Virtual Account
        const accountResponse = await paystack.post("/dedicated_account", {
            customer: customer.customer_code,
            preferred_bank: "test-bank",
        });

        return {
            status: true,
            data: {
                customer_code: customer.customer_code,
                customer_id: customer.id,
                email: customer.email,

                account_number:
                    accountResponse.data.data.account_number,

                account_name:
                    accountResponse.data.data.account_name,

                bank_name:
                    accountResponse.data.data.bank.name,

                dedicated_account_id:
                    accountResponse.data.data.id,
            },
        };
    } catch (error) {
        return {
            status: false,
            message:
                error.response?.data?.message ||
                error.message,
        };
    }
};



module.exports = {
  createPaystackAccount,
  isDigitsOnly,
  getOrCreateRecipient,
  initiateTransfer
};
