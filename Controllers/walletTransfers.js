const User = require('../Models/registeration'); // Import User model
const Wallet = require('../Models/walletSchema'); // Import Wallet model
const Transaction = require('../Models/transactionSchema'); // Import Transaction model


const mongoose = require('mongoose');


// Function to handle wallet-to-wallet transfer
async function walletToWalletTransfer(req, res) {
  const { senderId, receiverId, amount } = req.body;

  if (!senderId || !receiverId || !amount || amount <= 0) {
    return res.status(400).json({ message: 'Invalid transfer details' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const senderWallet = await Wallet.findOne({ userId: senderId, type: 'user' }).session(session);
    const receiverWallet = await Wallet.findOne({ userId: receiverId, type: 'user' }).session(session);

    if (!senderWallet || !receiverWallet) {
      await session.abortTransaction();
      return res.status(404).json({ message: 'Sender or receiver wallet not found' });
    }

    if (senderWallet.balance < amount) {
      await session.abortTransaction();
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Update balances
    senderWallet.balance -= amount;
    receiverWallet.balance += amount;

    await senderWallet.save({ session });
    await receiverWallet.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(200).json({
      message: 'Transfer successful',
      senderNewBalance: senderWallet.balance,
      receiverNewBalance: receiverWallet.balance,
    });

  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    console.error('Transfer error:', error);
    return res.status(500).json({ message: 'Transfer failed', error: error.message });
  }
}
const bcrypt = require('bcrypt'); // To verify hashed pin

//Wallet to Wallet transfer function
// This function handles the transfer of funds between wallets
async function transferFunds(req, res) {
  try {
    const senderId = req.user.id; // from auth middleware
    console.log('Sender ID:', senderId);
    const senderEmail = req.user.email; // from auth middleware
    const { recipientEmail, amount, pin } = req.body;

    if (!recipientEmail || !amount || !pin) {
      return res.status(400).json({ status: false, message: 'Recipient email, amount, and pin are required' });
    }

    // Convert amount to number and validate
    const transferAmount = parseFloat(amount);
    if (isNaN(transferAmount) || transferAmount <= 0) {
      return res.status(400).json({ status: false, message: 'Invalid transfer amount' });
    }

    // Find sender and recipient
    const senderWallet = await Wallet.findOne({ userId: senderId, type: 'user' });
    console.log('Sender Wallet:', senderWallet);
    const recipientUser = await User.findOne({ email: recipientEmail });
    if (!recipientUser) return res.status(404).json({ status: false, message: 'Recipient not found' });

    // Prevent self-transfer
    if (senderId === recipientUser._id.toString()) {
      return res.status(400).json({ status: false, message: 'You cannot transfer funds to yourself' });
    }

    const recipientWallet = await Wallet.findOne({ userId: recipientUser._id, type: 'user' });
    if (!recipientWallet) return res.status(404).json({ status: false, message: 'Recipient wallet not found' });

    // Check balance
    if (senderWallet.balance < transferAmount) {
      return res.status(400).json({ status: false, message: 'Insufficient funds' });
    }

    // Verify pin
    const validPin = await bcrypt.compare(pin, senderWallet.pin); // Assuming the pin is stored in `senderWallet.pin`
    if (!validPin) {
      return res.status(400).json({ status: false, message: 'Invalid PIN' });
    }

    // Update balances
    senderWallet.balance -= transferAmount;
    recipientWallet.balance += transferAmount;
    await senderWallet.save();
    await recipientWallet.save();

    // Record transactions
    const timestamp = new Date();

    const senderTxn = new Transaction({
      userId: senderId,
      amount: transferAmount,
      type: 'debit',
      status: 'success',
      purpose: 'wallet_transfer',
      reference: `TRF-${Date.now()}`,
      balanceBefore: senderWallet.balance + transferAmount,
      balanceAfter: senderWallet.balance,
      senderWalletId: senderWallet._id,
      receiverWalletId: recipientWallet._id,
      transactionType: 'wallet_transfer_sent',
      category: 'debit',
      createdAt: timestamp,
    });

    const recipientTxn = new Transaction({
      userId: recipientUser._id,
      amount: transferAmount,
      type: 'credit',
      status: 'success',
      purpose: 'wallet_transfer',
      reference: `TRF-${Date.now()}`,
      balanceBefore: recipientWallet.balance - transferAmount,
      balanceAfter: recipientWallet.balance,
      senderWalletId: senderWallet._id,
      receiverWalletId: recipientWallet._id,
      transactionType: 'wallet_transfer_received',
      category: 'credit',
      createdAt: timestamp,
    });

    await senderTxn.save();
    await recipientTxn.save();

    return res.status(200).json({
      status: true,
      message: 'Transfer successful',
      data: {
        from: senderWallet.userId,
        to: recipientWallet.userId,
        amount: transferAmount,
      },
    });

  } catch (err) {
    console.error('Transfer error:', err.message);
    return res.status(500).json({ status: false, message: 'Server error during transfer', error: err.message });
  }
};


module.exports = {
  walletToWalletTransfer,
  transferFunds
  // Other functions can be added here
};