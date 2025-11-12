const mongoose = require('mongoose');

const chargesSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
  },
  chargeType: {
    type: String,
    enum: ['Flat', 'Percentage'],
    default: 'Flat',
    required: true,
  },
  amount: {
    type: Number,
    required: true,
    min: 0,
  },
  description: {
    type: String,
    trim: true,
  },
  schoolId: {
    type:String,
    required: false,
  },
  status: {
    type: String,
    enum: ['Active', 'Inactive'],
    default: 'Active',
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'regUser',
  }
}, { timestamps: true });

module.exports = mongoose.model('Charge', chargesSchema);
