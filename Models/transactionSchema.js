// models/Transaction.js
const mongoose = require('mongoose');

const transactionSchema = new mongoose.Schema({
  senderWalletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: true
  },
  receiverWalletId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Wallet',
    required: false // Not required for deposits or withdrawals
  },
  transactionType: {
    type: String,
    required: true,
    enum: [
      // Credit
      'deposit', 'wallet_transfer_received', 'loan_disbursement', 'refund', 'salary_payment', 'bonus', 'wallet_topup', 'fee_payment_received',
    'transfer_charge',
      // Debit
      'withdrawal', 'wallet_transfer_sent', 'loan_repayment', 'purchase', 'fee_payment', 'subscription_payment', 'wallet_deduction', 'bank_transfer',
      // Internal
      'internal_adjustment', 'commission_credit', 'commission_debit', 'wallet_to_loan_wallet', 'school_fee_allocation',
      // Withdrawal
      'withdrawal_request', 'withdrawal_approved', 'withdrawal_rejected', 'withdrawal_completed', 'withdrawal_failed', 'withdrawal_reversal', 'withdrawal_charge',
      // reverse
      'reverse_transaction', 'reversal_request', 'reversal_approved', 'reversal_rejected', 'reversal_completed', 'reversal_failed', 'reversal'

    ]
  },
  category: {
    type: String,
    enum: ['credit', 'debit', 'internal', 'withdrawal', 'deposit'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  balanceBefore: {
    type: Number,
    required: true
  },
  errorCode: {
    type: String,
    required: false,
    default: null // Optional field for error codes
  },
  balanceAfter: {
    type: Number,
    required: true
  },
  reference: {
    type: String,
    required: true,
    unique: true
  },
  charges: {
    type: Number,
    required: false,
    default: 0 // Charges can be optional, e.g. for deposits
  },
  description: {
    type: String,
    required: false,
    default: 'No description provided'
  },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed'],
    default: 'success'
  },
  metadata: {
    type: Object
  }
}, {
  timestamps: true
});


// models/TransactionLimit.js

const transactionLimitSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "regUser",
    required: true,
  },
  parentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "regUser",
  },
  dailyLimit: {
    type: Number,
    default: 10000,
  },
  perTransactionLimit: {
    type: Number,
    default: 5000,
  },
  weeklyLimit: {
    type: Number,
    default: 25000,
  },
  currentDailySpent: {
    type: Number,
    default: 0,
  },
  currentWeeklySpent: {
    type: Number,
    default: 0,
  },
  lastResetDate: {
    type: Date,
    default: Date.now,
  },
});

const paystack = new mongoose.Schema({
  dedicatedAccountId: {
    type: String,
    required: true,
  },
  accountNumber: {
    type: String,
    required: true,
  },
  bankName: {
    type: String,
    required: true,
  },
  accountName: {
    type: String,
    required: true,
  },
});

const PaystackDedicatedAccount = mongoose.model("PaystackDedicatedAccount", paystack);
const TransactionLimit = mongoose.model("TransactionLimit", transactionLimitSchema);
const Transaction = mongoose.model('Transaction', transactionSchema);


module.exports = { Transaction, TransactionLimit, PaystackDedicatedAccount };
