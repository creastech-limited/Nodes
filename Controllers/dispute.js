const disputeData = require('../Models/dispute');
const regUser = require('../Models/registeration');
const jwt = require('jsonwebtoken');
const Transaction = require('../Models/transactionSchema'); // adjust to your transaction model name

exports.createDispute = async (req, res) => {
  try {
    const userId = req.user.id;

    const {
      disputeType,
      description,
      transactionId,
      paymentCategory,
      amount,
      supportingDocuments
    } = req.body;

    // ✅ Check if user exists and is active
    const user = await regUser.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({ message: 'User is not active' });
    }

    // ✅ Check if the transaction exists
    const transaction = await Transaction.findById(transactionId);
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // ✅ Check if user is sender or receiver
    const isSender = transaction.senderId?.toString() === userId;
    const isReceiver = transaction.receiverId?.toString() === userId;

    if (!isSender && !isReceiver) {
      return res.status(403).json({ message: 'Unauthorized: You are not part of this transaction' });
    }

    // ✅ Create the dispute
    const dispute = new disputeData({
      userId,
      disputeType,
      description,
      transactionId,
      status: 'Pending',
      disputeDate: new Date(),
      paymentCategory,
      amount,
      supportingDocuments
    });

    const savedDispute = await dispute.save();

    res.status(201).json({
      message: 'Dispute created successfully',
      savedDispute
    });
  } catch (error) {
    console.error('Create Dispute Error:', error);
    res.status(500).json({ message: error.message });
  }
};


exports.getDisputesByUser = async (req, res) => {
    try {
      const userId = req.user.id; // pulled from JWT
  
      const disputes = await disputeData.find({ userId })
        .populate('transactionId')
        .populate('resolvedBy', 'fullName email')
        .sort({ createdAt: -1 });
  
      res.status(200).json(disputes);
    } catch (error) {
      console.error('Error fetching user disputes:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };