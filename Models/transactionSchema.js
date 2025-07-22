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
      // Debit
      'withdrawal', 'wallet_transfer_sent', 'loan_repayment', 'purchase', 'fee_payment', 'subscription_payment', 'wallet_deduction',
      // Internal
      'internal_adjustment', 'commission_credit', 'commission_debit', 'wallet_to_loan_wallet', 'school_fee_allocation'
    ]
  },
  category: {
    type: String,
    enum: ['credit', 'debit', 'internal'],
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

module.exports = mongoose.model('Transaction', transactionSchema);
