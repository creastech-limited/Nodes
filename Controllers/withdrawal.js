const express = require('express');
const axios = require('axios');
require('dotenv').config();
const Wallet = require('../Models/walletSchema');
const Transaction = require('../Models/transactionSchema');
const { sendEmail } = require('../utils/email');
const { sendNotification } = require('../utils/notification');
const { generateReference } = require('../utils/generateReference');
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
  //failed transaction if user is not logged in or pin is not set
  const failTransaction = async (reason, fee = null, student = null, senderWallet = null, receiverWallet = null) => {
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
//find user wallet
  const senderWallet = await Wallet.findOne({ userId: currentUserId });
  if (!senderWallet) {
    await failTransaction('Sender wallet not found');
    await sendNotification(currentUserId, '❌ Withdrawal failed: Sender wallet not found', 'error');
    return res.status(404).json({ error: 'Sender wallet not found' });
  }
  if (senderWallet.balance < req.body.amount) {
    await failTransaction('Insufficient balance', null, null, senderWallet);
    await sendNotification(currentUserId, '❌ Withdrawal failed: Insufficient balance', 'error'); 
    return res.status(400).json({ error: 'Insufficient balance' });
  }
  const senderWalletId = senderWallet._id;
  // Extract withdrawal details from request body
  const { account_number, bank_code,bank_name, amount, description, pin } = req.body;

  try {
    // Validate input
    if (!account_number || !bank_code || !amount || !description || !pin) {
      await failTransaction('Missing required fields');
      await sendNotification(currentUserId, '❌ Withdrawal failed: Missing required fields', 'error');
      return res.status(400).json({ error: 'Missing required fields' });
    }
   
    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      await failTransaction('Invalid amount');
      await sendNotification(currentUserId, '❌ Withdrawal failed: Invalid amount', 'error');
      return res.status(400).json({ error: 'Invalid amount' });
    }
    // Validate account number and bank code
    if (!/^\d{10}$/.test(account_number)) {
      await failTransaction('Invalid account number format');
      await sendNotification(currentUserId, '❌ Withdrawal failed: Invalid account number format', 'error');
      return res.status(400).json({ error: 'Invalid account number format' });
    }
    if (!/^\d{3,4}$/.test(bank_code)) {
      await failTransaction('Invalid bank code format');
      await sendNotification(currentUserId, '❌ Withdrawal failed: Invalid bank code format', 'error');
      return res.status(400).json({ error: 'Invalid bank code format' });
    }
     // Validate PIN
    const isPinValid = await user.verifyPin(pin);
    if (!isPinValid) {
      await failTransaction('Invalid PIN');
      await sendNotification(currentUserId, '❌ Withdrawal failed: Invalid PIN', 'error');
      return res.status(401).json({ error: 'Invalid PIN' });
    }

    // 1. Get sender wallet and balance
    const senderWallet = await Wallet.findById(senderWalletId).populate('userId');
    if (!senderWallet){ 
      await failTransaction('Sender wallet not found');
      await sendNotification(currentUserId, '❌ Withdrawal failed: Sender wallet not found', 'error');
      return res.status(404).json({ error: 'Sender wallet not found' });}

    const sender = senderWallet.userId;
    if (senderWallet.balance < amount) {
      await failTransaction('Insufficient balance', null, sender, senderWallet);
      await sendNotification(currentUserId, '❌ Withdrawal failed: Insufficient balance', 'error');
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // 2. Step 1: Create Transfer Recipient
    const recipientResponse = await axios.post('https://api.paystack.co/transferrecipient', {
      type: 'nuban',
      name: sender.name,
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

    // 3. Step 2: Initiate Transfer
    const transferResponse = await axios.post('https://api.paystack.co/transfer', {
      source: 'balance',
      reason: description,
      amount: amount * 100, // Convert to kobo
      recipient: recipientCode,
    }, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    // 4. Step 3: Deduct wallet balance
    const senderBalanceBefore = senderWallet.balance;
    senderWallet.balance -= amount;
    const senderBalanceAfter = senderWallet.balance;
    await senderWallet.save();

    // 5. Step 4: Save transaction
    const trx = new Transaction({
      senderWalletId: senderWallet._id,
      receiverWalletId: null, // external bank
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
        senderEmail: sender.email,
      }
    });
    await trx.save();

    // 6. Step 5: Send Email
    await sendEmail({
      to: sender.email,
      subject: 'Bank Transfer Successful',
      html: `
        <p>Hello ${sender.name},</p>
        <p>You successfully transferred <strong>₦${amount}</strong> to account <strong>${account_number}</strong> (${bank_name}).</p>
        <p>Reference: <strong>${trx.reference}</strong></p>
        <p>Description: ${description}</p>
        <p>Thank you!</p>
      `
    });

    // 7. Step 6: Send Notification
    await sendNotification(sender._id, `✅ Bank transfer successful: ₦${amount} to ${account_number}`, 'success');

    res.status(200).json({ message: 'Transfer successful', transaction: trx });

  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: 'Bank transfer failed' });
  }
}