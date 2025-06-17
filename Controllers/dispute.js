const disputeData = require('../Models/dispute');
const {regUser} = require('../Models/registeration');
const jwt = require('jsonwebtoken');
const Wallet = require('../Models/walletSchema'); // adjust to your wallet model name
const Transaction = require('../Models/transactionSchema'); // adjust to your transaction model name

exports.createDispute = async (req, res) => {
  try {
    const userId = req.user?.id;

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
    //check if user is a school
    if (!user || user.role !== 'school') {
      return res.status(403).json({ message: 'Unauthorized: User is not a school' });
    }
    

    if (user.status !== 'Active') {
      return res.status(403).json({ message: 'User is not active' });
    }

    // ✅ Check if the transaction exists
    const transaction = await Transaction.findOne({reference: transactionId});
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }
    // Get User Wallet ID
    const userWallet = await Wallet.findOne({userId: userId});
    if (!userWallet) {
      return res.status(404).json({ message: 'User wallet not found' });
    }
const userWalletId = userWallet._id.toString();    
    // console.log('Transaction found:', transaction);
    // ✅ Check if user is sender or receiver
    const isSender = transaction.senderWalletId?.toString() === userWalletId;
    const isReceiver = transaction.receiverWalletId?.toString() === userWalletId;
    console.log('Is Sender:', isSender, 'Is Receiver:', isReceiver);

    if (!isSender && !isReceiver) {
      return res.status(403).json({ message: 'Unauthorized: You are not part of this transaction' });
    }

    // ✅ Create the dispute
    const dispute = new disputeData({
      userId,
      disputeType,
      description,
      transactionId: transaction._id, // Use the transaction ID from the found transaction
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