// models/RefreshToken.js
const mongoose = require('mongoose');

const RefreshTokenSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'regUser', required: true },
  token: { type: String, required: true },
  createdAt: { type: Date, default: Date.now, expires: '30d' }, // auto-delete after 30 days
});

module.exports = mongoose.model('RefreshToken', RefreshTokenSchema);
