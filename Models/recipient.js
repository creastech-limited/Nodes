const mongoose = require('mongoose');

const recipientSchema = new mongoose.Schema({
  account_number: { type: String, required: true },
  bank_code: { type: String, required: true },
  name: { type: String },
  recipient_code: { type: String, required: true },
  currency: { type: String, default: 'NGN' }
}, { timestamps: true });

recipientSchema.index({ account_number: 1, bank_code: 1 }, { unique: true });

module.exports = mongoose.model('Recipient', recipientSchema);
