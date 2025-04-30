const disputeData = require('../Models/dispute');
const regUser = require('../Models/registeration');
const jwt = require('jsonwebtoken');




exports.createDispute = async (req, res) => {
    const { userId, disputeType, description,status,disputeDate,resolvedBy,resolutionDetails,resolvedDate,paymentCategory,amount,supportingDocuments } = req.body;
    const dispute = new disputeData({
        userId,
        disputeType,
        description,
        status: 'Pending', // Default status
        disputeDate: new Date(), // Current date
        resolvedBy, // Initially null
        resolutionDetails, // Initially 
        resolvedDate, // Initially null
        paymentCategory, // Initially null
        amount, // Initially null
        supportingDocuments // Initially empty array

    });
    try {
      // Check if the user exists and is active
    const user = await regUser.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.status !== 'Active') {
      // If the user is not active, return a 403 Forbidden response
      return res.status(403).json({ message: 'User is not active' });
    }
        const savedDispute = await dispute.save();
        res.status(200).json({
          
            message: 'Dispute created successfully',
            savedDispute
          
        });
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
}

exports.getDisputesByUser = async (req, res) => {
    try {
      const userId = req.user.id; // pulled from JWT
  
      const disputes = await Dispute.find({ userId })
        .populate('transactionId')
        .populate('resolvedBy', 'fullName email')
        .sort({ createdAt: -1 });
  
      res.status(200).json(disputes);
    } catch (error) {
      console.error('Error fetching user disputes:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };