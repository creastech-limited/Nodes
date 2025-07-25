const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'regUser', required: true },
  title: String,
  message: String,
  read: { type: Boolean, default: false },
  type: { type: String, enum: ['info', 'warning', 'error', 'success'], default: 'info' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
