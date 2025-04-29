const User = require('../Models/registeration'); // Import User model
const Wallet = require('../Models/walletSchema'); // Import Wallet model

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

module.exports = {
  walletToWalletTransfer,
  // Other functions can be added here
};