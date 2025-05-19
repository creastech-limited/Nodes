const mongoose = require('mongoose');


const feeSchema = new mongoose.Schema({
  schoolId: { type: String, required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  amount: { type: Number, required: true },
  description: { type: String },
  term: { type: String, required: true }, // e.g., "First Term", "Second Term"
  session: { type: String, required: true }, // e.g., "2024/2025"
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Fee', feeSchema);