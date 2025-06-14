const mongoose = require('mongoose');


const feeSchema = new mongoose.Schema({
  schoolId: { type: String, required: true },
  classId: { type: mongoose.Schema.Types.ObjectId, ref: 'Class', required: true },
  className: { type: String, required: true },
  amount: { type: Number, required: true },
  description: { type: String },
  term: { type: String, required: true }, // e.g., "First Term", "Second Term"
  session: { type: String, required: true }, // e.g., "2024/2025",
  feeType: { type: String, required: true }, // e.g., "Tuition", "Exam Fee"
  status: { type: String, default: 'Pending', enum: ['Pending', 'Active'] },
  dueDate: { type: Date, required: true }, // e.g., "2024-12-31"
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });

const Fee = mongoose.model('Fee', feeSchema);

// const feeStatusSchema = new mongoose.Schema({
//   studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//   feeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fee', required: true },
//   status: { type: String, enum: ['unpaid', 'paid', 'partial'], default: 'unpaid' },
//   amountPaid: { type: Number, default: 0 },
// }, { timestamps: true });

// module.exports = mongoose.model('FeeStatus', feeStatusSchema);
const feePaymentSchema = new mongoose.Schema({
  studentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  feeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Fee', required: true },
  amount: { type: Number, required: true },
  feeType: { type: String, required: true }, // e.g., "Tuition", "Exam Fee"
  term: { type: String, required: true }, // e.g., "First Term", "Second Term"
  session: { type: String, required: true }, // e.g., "2024/2025",
  className: { type: String, required: true },
  schoolId: { type: String, required: true },
  amountPaid: { type: Number, required: true },
  paymentMethod: { type: String, enum: ['bank_transfer', 'card_payment', 'wallet_transfer', 'cash', 'none'], required: true },
  transactionId: { type: String, required: true }, // Reference to the transaction,
  paymentDate: { type: Date, default: Date.now },
  status: { type: String, enum: ['Unpaid', 'Completed', 'Failed','partial'], default: 'Unpaid' },
}, { timestamps: true });
const FeePayment = mongoose.model('FeePayment', feePaymentSchema);

module.exports = { Fee, FeePayment };

