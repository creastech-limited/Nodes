const mongoose = require('mongoose');


const feeSchema = new mongoose.Schema({
  schoolId: { type: String, required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  amount: { type: Number, required: true },
  description: { type: String },
  term: { type: String, required: true }, // e.g., "First Term", "Second Term"
  session: { type: String, required: true }, // e.g., "2024/2025",
  feeType: { type: String, required: true }, // e.g., "Tuition", "Exam Fee"
  status: { type: String, default: 'Pending', enum: ['Pending', 'Paid', 'Overdue'] },
  dueDate: { type: Date, required: true }, // e.g., "2024-12-31"
  paidDate: { type: Date }, // e.g., "2024-12-01"
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

module.exports = mongoose.model('Fee', feeSchema);