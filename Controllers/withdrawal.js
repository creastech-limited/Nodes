const express = require('express');
const axios = require('axios');
require('dotenv').config();
const Wallet = require('../Models/walletSchema');
const Transaction = require('../Models/transactionSchema');
const { sendEmail } = require('../utils/email');
const { sendNotification } = require('../utils/notification');
const { generateReference } = require('../utils/generatereference');
const {regUser} = require('../Models/registeration');
// Paystack secret key from environment variables
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

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
      params: { account_number, bank_code },
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


//Withdrawal route
exports.withdrawal = async (req, res) => {
  const currentUserId = req.user?.id;

  // Helper function for failed transactions
  const failTransaction = async (reason, fee = null, student = null, senderWallet = null, receiverWallet = null, amount = 0) => {
    try {
      const reference = generateReference('FEE_FAIL');
      await Transaction.create({
        senderWalletId: senderWallet?._id || null,
        receiverWalletId: receiverWallet?._id || null,
        transactionType: 'fee_payment',
        category: 'debit',
        amount,
        balanceBefore: senderWallet?.balance || 0,
        balanceAfter: senderWallet?.balance || 0,
        reference,
        description: `Failed fee payment of ₦${amount}${student?.name ? ' for ' + student.name : ''}${fee ? ` (${fee.feeType}, ${fee.term}, ${fee.session})` : ''} - Reason: ${reason}`,
        status: 'failed',
        metadata: {
          studentId: student?._id,
          feeId: fee?._id,
          reason,
        },
      });
    } catch (err) {
      console.error('Error saving failed transaction:', err.message);
    }
  };

  if (!currentUserId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const user = await regUser.findById(currentUserId);
  if (!user) {
    await failTransaction('User not found');
    await sendNotification(currentUserId, '❌ Withdrawal failed: User not found', 'error');
    return res.status(404).json({ error: 'User not found' });
  }

  if (!user.isPinSet) {
    await failTransaction('PIN not set');
    await sendNotification(currentUserId, '❌ Withdrawal failed: PIN not set', 'error');
    return res.status(400).json({ error: 'PIN not set' });
  }

  const senderWallet = await Wallet.findOne({ userId: currentUserId }).populate('userId');
  if (!senderWallet) {
    await failTransaction('Sender wallet not found');
    await sendNotification(currentUserId, '❌ Withdrawal failed: Sender wallet not found', 'error');
    return res.status(404).json({ error: 'Sender wallet not found' });
  }

  const { account_number, bank_code, bank_name, amount, description, pin } = req.body;

  try {
    if (!account_number || !bank_code || !amount || !description || !pin) {
      await failTransaction('Missing required fields', null, null, senderWallet, null, amount);
      await sendNotification(currentUserId, '❌ Withdrawal failed: Missing required fields', 'error');
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (isNaN(amount) || amount <= 0) {
      await failTransaction('Invalid amount', null, null, senderWallet, null, amount);
      await sendNotification(currentUserId, '❌ Withdrawal failed: Invalid amounts', 'error');
      return res.status(400).json({ error: 'Invalid amount' });
    }

    if (!/^\d{10}$/.test(account_number)) {
      await failTransaction('Invalid account number format', null, null, senderWallet, null, amount);
      await sendNotification(currentUserId, '❌ Withdrawal failed: Invalid account number format', 'error');
      return res.status(400).json({ error: 'Invalid account number format' });
    }

    if (!/^\d{3,4}$/.test(bank_code)) {
      await failTransaction('Invalid bank code format', null, null, senderWallet, null, amount);
      await sendNotification(currentUserId, '❌ Withdrawal failed: Invalid bank code format', 'error');
      return res.status(400).json({ error: 'Invalid bank code format' });
    }

    const isPinValid = await user.verifyPin(pin);
    if (!isPinValid) {
      await failTransaction('Invalid PIN', null, null, senderWallet, null, amount);
      await sendNotification(currentUserId, '❌ Withdrawal failed: Invalid PIN', 'error');
      return res.status(401).json({ error: 'Invalid PIN' });
    }
    console.log('PIN verified successfully', user.pin);

    if (senderWallet.balance < amount) {
      await failTransaction('Insufficient balance', null, null, senderWallet, null, amount);
      await sendNotification(currentUserId, '❌ Withdrawal failed: Insufficient balance', 'error');
      return res.status(400).json({ error: 'Insufficient balance' });
    }
    console.log('Sufficient balance for withdrawal', senderWallet.balance, amount);
    console.log('Initiating bank transfer to', account_number, 'at', bank_name);
    console.log('Transfer description:', user.name, '-', description);  
    // 1. Create Transfer Recipient
    const recipientResponse = await axios.post('https://api.paystack.co/transferrecipient', {
      type: 'nuban',
      name: user.name,
      account_number,
      bank_code,
      currency: 'NGN'
    }, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const recipientCode = recipientResponse.data.data.recipient_code;

    // 2. Initiate Transfer
    const transferResponse = await axios.post('https://api.paystack.co/transfer', {
      source: 'balance',
      reason: description,
      amount: amount * 100,
      recipient: recipientCode,
    }, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // 3. Deduct wallet
    const senderBalanceBefore = senderWallet.balance;
    senderWallet.balance -= amount;
    const senderBalanceAfter = senderWallet.balance;
    await senderWallet.save();

    // 4. Log transaction
    const trx = await Transaction.create({
      senderWalletId: senderWallet._id,
      receiverWalletId: null,
      transactionType: 'bank_transfer',
      category: 'debit',
      amount,
      balanceBefore: senderBalanceBefore,
      balanceAfter: senderBalanceAfter,
      reference: transferResponse.data.data.reference,
      description,
      status: 'success',
      metadata: {
        receiverAccount: account_number,
        receiverBank: bank_code,
        senderEmail: user.email,
      }
    });

    // 5. Email
    await sendEmail({
      to: user.email,
      subject: 'Bank Transfer Successful',
      html: `
        <p>Hello ${user.name},</p>
        <p>You successfully transferred <strong>₦${amount}</strong> to account <strong>${account_number}</strong> (${bank_name}).</p>
        <p>Reference: <strong>${trx.reference}</strong></p>
        <p>Description: ${description}</p>
        <p>Thank you!</p>
      `
    });

    // 6. Notification
    await sendNotification(user._id, `✅ Bank transfer successful: ₦${amount} to ${account_number}`, 'success');

    res.status(200).json({ message: 'Transfer successful', transaction: trx });

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Bank transfer failed' });
  }
};
