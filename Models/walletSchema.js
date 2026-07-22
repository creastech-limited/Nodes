// models/Wallet.js
const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // Paystack Customer
  customer_code: {
    type: String,
    default: null,
  },

  customer_id: {
    type: Number,
    default: null,
  },

  // Dedicated Account
  dedicated_account_id: {
    type: Number,
    default: null,
  },

  account_number: {
    type: String,
    default: null,
  },

  account_name: {
    type: String,
    default: null,
  },

  bank_name: {
    type: String,
    default: null,
  },

  // Wallet
  balance: {
    type: Number,
    default: 0,
  },

  currency: {
    type: String,
    default: "NGN",
  },

  type: {
    type: String,
    enum: ["user", "system", "charges", "agent"],
    default: "user",
  },

  walletName: {
    type: String,
    default: "Default Wallet",
    required: true,
  },

  // User Snapshot
  email: {
    type: String,
    required: true,
  },

  firstName: {
    type: String,
    required: true,
  },

  lastName: {
    type: String,
    required: true,
  },

  phone: String,

  lastTransaction: Date,

  lastTransactionAmount: {
    type: Number,
    default: 0,
  },

  lastTransactionType: {
    type: String,
    enum: ["credit", "debit"],
  },
}, {
  timestamps: true,
});

module.exports = mongoose.model('Wallet', walletSchema);