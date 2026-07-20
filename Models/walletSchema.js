// models/Wallet.js
const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },

  // Customer Details
  paystackCustomerId: {
    type: Number,
  },

  paystackCustomerCode: {
    type: String,
    required: true,
  },

  // Dedicated Account Details
  paystackDedicatedAccountId: {
    type: Number,
  },

  paystackAccountNumber: {
    type: String,
  },

  paystackAccountName: {
    type: String,
  },

  paystackBankName: {
    type: String,
  },

  paystackBankId: {
    type: Number,
  },

  paystackBankSlug: {
    type: String,
  },

  paystackAccountType: {
    type: String,
  },

  paystackAssigned: {
    type: Boolean,
    default: false,
  },

  paystackActive: {
    type: Boolean,
    default: false,
  },

  paystackCurrency: {
    type: String,
    default: "NGN",
  },

  paystackAssignment: {
    integration: Number,
    assigneeId: Number,
    assigneeType: String,
    expired: Boolean,
    assignedAt: Date,
  },

  // Wallet Details
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

  // Transaction Info
  lastTransaction: Date,

  lastTransactionAmount: {
    type: Number,
    default: 0,
  },

  lastTransactionType: {
    type: String,
    enum: ["credit", "debit"],
  },
},
{
  timestamps: true,

});


module.exports = mongoose.model('Wallet', walletSchema);