const mongoose = require('mongoose');

const disputeSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  schoolId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'School', // Reference to the school if applicable
    required: false, // Optional if disputes can be raised by users directly
  },
  // Enum for dispute types
  // Billing Issue, Account Discrepancy, Transaction Error, Service Concern, Other
  disputeType: {
    type: String,
    required: true,
    enum: [
  'Billing Issue',         // Incorrect or duplicate bills
  'Account Discrepancy',   // Wallet balance or account mismatch
  'Transaction Error',     // Failed or unverified payments
  'Service Concern',       // Issues with provided services (e.g. access to platform, fees not reflecting)
  'Other'                  // Any other issue not classified above
], // Types of disputes
  },
  description: { 
    type: String, 
    required: true 
  },
  disputeDate: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    required: true,
    enum: ['Pending', 'Under Investigation', 'Resolved', 'Closed'], // Dispute status
    default: 'Pending',
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', // Reference to the admin or user resolving the dispute
  },
  transactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Transaction',
    required: true,
  },
  resolvedDate: {
    type: Date,
  },
  paymentCategory: {
    type: String,
    enum: ['Deposit', 'Withdrawal', 'Transfer', 'Store Purchase','TopUp', 'Other'], // Associated payment type if relevant
  },
  amount: {
    type: Number, // This could be used for disputes related to transactions
    min: 0,
  },
  
  supportingDocuments: [{
    type: String, // Links or paths to documents like images, PDFs, etc.
  }],
}, { timestamps: true });

const Dispute = mongoose.model('Dispute', disputeSchema);

module.exports = Dispute;
