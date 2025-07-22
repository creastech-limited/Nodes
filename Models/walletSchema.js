// models/Wallet.js
const mongoose = require('mongoose');

const walletSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true},
  balance: { type: Number, default: 0 },
  currency: { type: String, default: 'NGN' },
  type: {type: String, enum: ['user', 'system', 'charges'],  default: 'user'},
  email: { type: String, required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  phone: { type: String },
});

module.exports = mongoose.model('Wallet', walletSchema);