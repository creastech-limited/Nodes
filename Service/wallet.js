const Wallet = require("../Models/walletSchema");
const {Transaction} = require("../Models/transactionSchema");
const { sendNotification } = require("../utils/notification");

async function creditWallet({
  wallet,
  amount,
  reference,
  transactionType = "wallet_topup",
  category = "credit",
  description,
  initiatedBy = null,
  metadata = {},
}) {
  // Prevent duplicate processing
  const existingTransaction = await Transaction.findOne({ reference });

  if (existingTransaction) {
    return {
      status: false,
      message: "Transaction already processed",
      transaction: existingTransaction,
    };
  }

  const balanceBefore = wallet.balance;
  const balanceAfter = balanceBefore + amount;

  // Update wallet
  wallet.balance = balanceAfter;
  wallet.lastTransaction = new Date();
  wallet.lastTransactionAmount = amount;
  wallet.lastTransactionType = "credit";

  await wallet.save();
  const systemWalletId = process.env.SYSTEM_WALLET_ID;
  const senderWallet = await Wallet.findById(systemWalletId);

  // Log transaction
  const transaction = await Transaction.create({
    senderWalletId: senderWallet._id,
    receiverWalletId: wallet._id,

    transactionType,
    category,

    amount,

    balanceBefore,
    balanceAfter,

    reference,

    description,

    status: "success",

    metadata,
  });

  // Notify user
  if (wallet.userId) {
    await sendNotification(
      wallet.userId,
      "Top Up",
      `Your wallet has been credited with ₦${amount.toLocaleString()}.`
    );
  }

  return {
    status: true,
    wallet,
    transaction,
  };
}

module.exports = {
  creditWallet,
};