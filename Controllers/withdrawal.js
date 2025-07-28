const express = require('express');
const axios = require('axios');
require('dotenv').config();
const https = require('https');
const Wallet = require('../Models/walletSchema');
const Transaction = require('../Models/transactionSchema');
const sendEmail = require('../utils/email');
const { sendNotification } = require('../utils/notification');
const { generateReference } = require('../utils/generatereference');
const createOrGetRecipient = require('../utils/paystack');
const {regUser} = require('../Models/registeration');
//verify pin
const bcrypt = require('bcryptjs');
// Paystack secret key from environment variables
const PAYSTACK_SECRET_KEY = "sk_live_8c3db99b858cc67db585ff878a69eb5d73d8bbbc"//process.env.PAYSTACK_SECRET_KEY;

exports.getBank =  async (req, res) => {
  try {
    const response = await axios.get('https://api.paystack.co/bank', {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
      }
    });
    res.json(response.data);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to fetch banks' });
  }
};



exports.resolveAccountNumber =  async (req, res) => {
  const { account_number, bank_code } = req.body;

  if (!account_number || !bank_code) {
    return res.status(400).json({ error: 'Missing account_number or bank_code' });
  }

  try {
    const response = await axios.get(`https://api.paystack.co/bank/resolve`, {
      body: { account_number, bank_code },
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`
      }
    });

    res.json(response.data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to verify account number' });
  }
}

exports.resolveAccount = async (req, res) => {
  const { account_number, bank_code } = req.query;

  if (!account_number || !bank_code) {
    return res.status(400).json({ message: 'account_number and bank_code are required' });
  }
    const queryParams = `account_number=${account_number}&bank_code=${bank_code}`;
  const options = {
    hostname: 'api.paystack.co',
    port: 443,
    path: `/bank/resolve?${queryParams}`,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`  
    }
  };

  const paystackReq = https.request(options, (paystackRes) => {
    let data = '';

    paystackRes.on('data', (chunk) => {
      data += chunk;
    });

    paystackRes.on('end', () => {
      try {
        const result = JSON.parse(data);
        res.status(paystackRes.statusCode).json(result);
      } catch (error) {
        res.status(500).json({ message: 'Error parsing Paystack response', error: error.message });
      }
    });
  });

  paystackReq.on('error', (error) => {
    res.status(500).json({ message: 'Error connecting to Paystack', error: error.message });
  });

  paystackReq.end();
}



//Withdrawal route
// exports.withdrawal = async (req, res) => {
//   const currentUserId = req.user?.id;
//   console.log('Current User ID:', currentUserId);

//   // Helper function for failed transactions
//   const failTransaction = async (reason, fee = null, student = null, senderWallet = null, receiverWallet = null, amount = 0) => {
//     try {
//       const reference = generateReference('FEE_FAIL');
//       await Transaction.create({
//         senderWalletId: senderWallet?._id || null,
//         receiverWalletId: receiverWallet?._id || null,
//         transactionType: 'fee_payment',
//         category: 'debit',
//         amount,
//         balanceBefore: senderWallet?.balance || 0,
//         balanceAfter: senderWallet?.balance || 0,
//         reference,
//         description: `Failed fee payment of ₦${amount}${student?.name ? ' for ' + student.name : ''}${fee ? ` (${fee.feeType}, ${fee.term}, ${fee.session})` : ''} - Reason: ${reason}`,
//         status: 'failed',
//         metadata: {
//           studentId: student?._id,
//           feeId: fee?._id,
//           reason,
//         },
//       });
//     } catch (err) {
//       console.error('Error saving failed transaction:', err.message);
//     }
//   };

//   if (!currentUserId) {
//     return res.status(401).json({ error: 'Unauthorized' });
//   }

//   const user = await regUser.findById(currentUserId);
//   if (!user) {
//     await failTransaction('User not found');
//     await sendNotification(currentUserId, '❌ Withdrawal failed: User not found', 'error');
//     return res.status(404).json({ error: 'User not found' });
//   }

//   if (!user.isPinSet) {
//     await failTransaction('PIN not set');
//     await sendNotification(currentUserId, '❌ Withdrawal failed: PIN not set', 'error');
//     return res.status(400).json({ error: 'PIN not set' });
//   }

//   const senderWallet = await Wallet.findOne({ userId: currentUserId }).populate('userId');
//   if (!senderWallet) {
//     await failTransaction('Sender wallet not found');
//     await sendNotification(currentUserId, '❌ Withdrawal failed: Sender wallet not found', 'error');
//     return res.status(404).json({ error: 'Sender wallet not found' });
//   }

//   const { account_number, bank_code, bank_name, amount, name, description, pin } = req.body;

//   try {
//     if (!account_number || !bank_code || !amount || !description || !pin) {
//       await failTransaction('Missing required fields', null, null, senderWallet, null, amount);
//       await sendNotification(currentUserId, '❌ Withdrawal failed: Missing required fields', 'error');
//       return res.status(400).json({ error: 'Missing required fields' });
//     }

//     if (isNaN(amount) || amount <= 0) {
//       await failTransaction('Invalid amount', null, null, senderWallet, null, amount);
//       await sendNotification(currentUserId, '❌ Withdrawal failed: Invalid amounts', 'error');
//       return res.status(400).json({ error: 'Invalid amount' });
//     }

//     if (!/^\d{10}$/.test(account_number)) {
//       await failTransaction('Invalid account number format', null, null, senderWallet, null, amount);
//       await sendNotification(currentUserId, '❌ Withdrawal failed: Invalid account number format', 'error');
//       return res.status(400).json({ error: 'Invalid account number format' });
//     }

//     // if (!/^\d+$/.test(bank_code)) {
//     //   await failTransaction('Invalid bank code format', null, null, senderWallet, null, amount);
//     //   await sendNotification(currentUserId, '❌ Withdrawal failed: Invalid bank code format', 'error');
//     //   return res.status(400).json({ error: 'Invalid bank code format' });
//     // }

//     const validPin =  bcrypt.compare(pin, user.pin)
//     if (!validPin) {
//       await failTransaction('Invalid PIN', null, null, senderWallet, null, amount);
//       await sendNotification(currentUserId, '❌ Withdrawal failed: Invalid PIN', 'error');
//       return res.status(401).json({ error: 'Invalid PIN' });
//     }
//     console.log('PIN verified successfully', user.pin);

//     if (senderWallet.balance < amount) {
//       await failTransaction('Insufficient balance', null, null, senderWallet, null, amount);
//       await sendNotification(currentUserId, '❌ Withdrawal failed: Insufficient balance', 'error');
//       return res.status(400).json({ error: 'Insufficient balance' });
//     }
//     console.log('Sufficient balance for withdrawal', senderWallet.balance, amount);
//     console.log('Initiating bank transfer to', account_number, 'at', bank_name);
//     console.log('Transfer description:', user.name, '-', description);  
//     // 1. Create Transfer Recipient
//      // Step 1: Create Paystack Recipient using utils


//     const recipientCode = await createRecipient({ name, account_number, bank_code });

//     // Step 2: Initiate transfer
//     const transferPayload = JSON.stringify({
//       source: "balance",
//       reason,
//       amount,
//       recipient: recipientCode
//     });

//     const options = {
//       hostname: 'api.paystack.co',
//       port: 443,
//       path: '/transfer',
//       method: 'POST',
//       headers: {
//         Authorization: 'Bearer YOUR_SECRET_KEY',
//         'Content-Type': 'application/json'
//       }
//     };
// const transferResponse = await new Promise((resolve, reject) => {
//       const req = https.request(options, res => {
//         let data = '';
//         res.on('data', chunk => data += chunk);
//         res.on('end', () => resolve(JSON.parse(data)));
//       });

//       req.on('error', error => reject(error));
//       req.write(transferPayload);
//       req.end();
//     });


//     // 3. Deduct wallet
//     const senderBalanceBefore = senderWallet.balance;
//     senderWallet.balance -= amount;
//     const senderBalanceAfter = senderWallet.balance;
//     await senderWallet.save();

//     // 4. Log transaction
//      // Step 3: Log transaction and deduct wallet
//     if (transferResponse.status && transferResponse.data && transferResponse.data.status === 'success') {
//       senderWallet.balance = senderBalanceAfter;
//       await senderWallet.save();

//       const trx = await Transaction.create({
//         senderWalletId: senderWallet._id,
//         receiverWalletId: null,
//         transactionType: 'withdrawal_completed',
//         category: 'debit',
//         amount,
//         balanceBefore: senderBalanceBefore,
//         balanceAfter: senderBalanceAfter,
//         reference: transferResponse.data.reference,
//         description,
//         status: 'success',
//         metadata: {
//           receiverAccount: account_number,
//           receiverBank: bank_code,
//           senderEmail: user.email,
//         }
//       });

//     // 5. Email
//     await sendEmail({
//       to: user.email,
//       subject: 'Bank Transfer Successful',
//       html: `
//         <p>Hello ${user.name},</p>
//         <p>You successfully transferred <strong>₦${amount}</strong> to account <strong>${account_number}</strong> (${bank_name}).</p>
//         <p>Reference: <strong>${trx.reference}</strong></p>
//         <p>Description: ${description}</p>
//         <p>Thank you!</p>
//       `
//     });

//     // 6. Notification
//     await sendNotification(user._id, `✅ Bank transfer successful: ₦${amount} to ${account_number}`, 'success');

//     res.status(200).json({ message: 'Transfer successful', transaction: trx });

//   } catch (error) {
//     console.error(error.response?.data || error.message);
//     res.status(500).json({ error: 'Bank transfer failed' });
//   }
//   }
// };  

exports.withdrawal = async (req, res) => {
  try {
    const { account_number, bank_code, amount, description } = req.body;
    const user = req.user?.id;
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }
    const currentUser = await regUser.findById(user);
    if (!currentUser) {
      return res.status(404).json({ message: 'User not found' });
    }
    const senderWallet = await Wallet.findOne({ userId: currentUser._id });
    if (!senderWallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    if (!account_number || !bank_code || !amount || !description) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    if (!isDigitsOnly(account_number)) {
      return res.status(400).json({ message: 'Account number must contain digits only' });
    }

    if (!isDigitsOnly(bank_code)) {
      return res.status(400).json({ message: 'Bank code must contain digits only' });
    }

    // Get recipient code (cached or new)
    const recipientCode = await getOrCreateRecipient(account_number, bank_code, currentUser.name);

    // You would pull wallet & balance here
    const senderBalanceBefore = senderWallet.balance;
    const senderBalanceAfter = senderBalanceBefore - amount;

    // Make transfer
    const transferResponse = await initiateTransfer({
      amount,
      recipientCode,
      reason: description
    });

    // Log transaction
    const trx = await Transaction.create({
      senderWalletId: senderWallet._id,
      receiverWalletId: senderWallet._id, // Assuming withdrawal goes to the same wallet
      transactionType: 'withdrawal_completed',
      category: 'debit',
      amount,
      balanceBefore: senderBalanceBefore,
      balanceAfter: senderBalanceAfter,
      reference: transferResponse.data.reference,
      description,
      status: 'success',
      metadata: {
        receiverAccount: account_number,
        receiverBank: bank_code,
        senderEmail: user.email,
      }
    });

    return res.status(200).json({
      message: 'Withdrawal successful',
      data: { trx, transferResponse }
    });

  } catch (err) {
    console.error(err?.response?.data || err.message);
    return res.status(500).json({ message: 'Withdrawal failed', error: err.message });
  }
};

// withdrawal rereversal


exports.reverseWithdrawal = async (req, res) => {
  const currentUserId = req.user?.id;
  if (!currentUserId) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  const { amount } = req.body;

  if (!amount) {
    return res.status(400).json({ message: 'amount are required' });
  }

  try {
    const wallet = await Wallet.findOne({userId: currentUserId });

    if (!wallet) return res.status(404).json({ message: 'Wallet not found' });

    // Credit back the withdrawn amount
    wallet.balance += Number(amount);
    await wallet.save();

    // Log the reversal transaction
    await Transaction.create({
      senderWalletId: wallet._id,
      receiverWalletId: wallet._id,
      transactionType: 'withdrawal_reversal',
      category: 'credit',
      amount: Number(amount),
      balanceBefore: wallet.balance - Number(amount),
      balanceAfter: wallet.balance,
      reference: generateReference('REV'),
      description: `Reversal of withdrawal transaction of ₦${amount}`,
      status: 'success',
      metadata: {
        userId: currentUserId,
        reason: 'Withdrawal reversal'
      }
    });

    res.status(200).json({ message: 'Withdrawal reversed and wallet credited successfully' });
  } catch (error) {
    console.error('Reversal error:', error);
    res.status(500).json({ message: 'Internal server error' });
    // Optionally, you can log the error to a monitoring service

  }
};
