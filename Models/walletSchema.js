// models/Wallet.js
const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  balance: { type: Number, default: 0 },
  currency: { type: String, default: 'NGN' },
  type: {type: String, enum: ['user', 'system', 'charges'],  default: 'user'},
  email: { type: String, required: true },
  walletName: { type: String, default: 'Default Wallet', required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  lastTransaction: { type: Date },
  lastTransactionAmount: { type: Number, default: 0 },
  lastTransactionType: { type: String, enum: ['credit', 'debit'], default: '' },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String },
});

module.exports = mongoose.model('Wallet', walletSchema);