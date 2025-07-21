const mongoose = require('mongoose');

const otpSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, required: true, ref: 'User' },
  otp: { type: String, required: true },
  expiresAt: { type: Date, required: true },
    attempts: { type: Number, default: 0 }, // Track number of attempts
}, { timestamps: true });


module.exports = mongoose.model('Otp', otpSchema);
