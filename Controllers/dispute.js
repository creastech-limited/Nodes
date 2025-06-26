const disputeData = require('../Models/dispute');
const {regUser} = require('../Models/registeration');
const jwt = require('jsonwebtoken');
const Wallet = require('../Models/walletSchema'); // adjust to your wallet model name
const Transaction = require('../Models/transactionSchema'); // adjust to your transaction model name
const { sendEmail } = require('../utils/email'); // adjust to your email utility path
const {sendNotification} = require('../utils/notification'); // adjust to your notification utility path
const { get } = require('mongoose');
// const { now } = require('mongoose');
// const { notify } = require('../routes/auth');

// exports.createDispute = async (req, res) => {
//   try {
//     const userId = req.user?.id;

//     const {
//       disputeType,
//       description,
//       transactionId,
//       paymentCategory,
//       amount,
//       school,
//       supportingDocuments
//     } = req.body;

//     // ✅ Check if user exists and is active
    
//     const user = await regUser.findById(userId);
//     if (!user) {
//       return res.status(404).json({ message: 'User not found' });
//     }
    
//     if (user.status !== 'Active') {
//       return res.status(403).json({ message: 'User is not active' });
//     }
//     const schoolID = user.schoolId || req.body.school;// Assuming the user has a schoolId field
//     if (!schoolID) {
//       return res.status(400).json({ message: 'School ID is required' });
//     }

//     // ✅ Check if the transaction exists
//     const transaction = await Transaction.findOne({reference: transactionId});
//     if (!transaction) {
//       return res.status(404).json({ message: 'Transaction not found' });
//     }
//     // Get User Wallet ID
//     const userWallet = await Wallet.findOne({userId: userId});
//     if (!userWallet) {
//       return res.status(404).json({ message: 'User wallet not found' });
//     }
// const userWalletId = userWallet._id.toString();    
//     // console.log('Transaction found:', transaction);
//     // ✅ Check if user is sender or receiver
//     const isSender = transaction.senderWalletId?.toString() === userWalletId;
//     const isReceiver = transaction.receiverWalletId?.toString() === userWalletId;
//     console.log('Is Sender:', isSender, 'Is Receiver:', isReceiver);

//     if (!isSender && !isReceiver) {
//       return res.status(403).json({ message: 'Unauthorized: You are not part of this transaction' });
//     }
//     //Add user sc
//     // ✅ Create the dispute
//     const dispute = new disputeData({
//       userId,
//       disputeType,
//       description,
//       transactionId: transaction._id, // Use the transaction ID from the found transaction
//       status: 'Pending',
//       disputeDate: new Date(),
//       paymentCategory,
//       amount,
//       school: schoolID, // Assuming the transaction has a schoolId field
//       supportingDocuments
//     });

//     const savedDispute = await dispute.save();

//     res.status(201).json({
//       message: 'Dispute created successfully',
//       savedDispute
//     });
//   } catch (error) {
//     console.error('Create Dispute Error:', error);
//     res.status(500).json({ message: error.message });
//   }
// };

exports.createDispute = async (req, res) => {
  try {
    const userId = req.user?.id;

    const {
      disputeType,
      description,
      transactionId,
      paymentCategory,
      amount,
      school,
      supportingDocuments
    } = req.body;

    // ✅ Validate required fields
    if (!disputeType || !description || !transactionId || !amount) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // ✅ Check if user exists and is active
    const user = await regUser.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (user.status !== 'Active') {
      return res.status(403).json({ message: 'User is not active' });
    }
    const schoolRecord = await regUser.findOne({_id: school});
    if (!schoolRecord) {
      return res.status(404).json({ message: 'School not found' });
    }
    console.log('School found:', schoolRecord._id);
    // ✅ Determine school ID
    const schoolID = user.schoolId || school;
    if (!schoolID) {
      return res.status(400).json({ message: 'School ID is required' });
    }
console.log('School ID:', schoolID);
    // ✅ Validate and parse amount
    const cleanedAmount = parseFloat(amount);
    if (isNaN(cleanedAmount) || cleanedAmount <= 0) {
      return res.status(400).json({ message: 'Invalid amount value' });
    }

    // ✅ Check if the transaction exists
    const transaction = await Transaction.findOne({ reference: transactionId });
    if (!transaction) {
      return res.status(404).json({ message: 'Transaction not found' });
    }

    // ✅ Get User Wallet ID
    const userWallet = await Wallet.findOne({ userId: userId });
    if (!userWallet) {
      return res.status(404).json({ message: 'User wallet not found' });
    }

    const userWalletId = userWallet._id.toString();

    // ✅ Check if user is sender or receiver
    const isSender = transaction.senderWalletId?.toString() === userWalletId;
    const isReceiver = transaction.receiverWalletId?.toString() === userWalletId;

    if (!isSender && !isReceiver) {
      return res.status(403).json({ message: 'Unauthorized: You are not part of this transaction' });
    }

    // ✅ Check for existing open disputes for the same transaction
    const existingDispute = await disputeData.findOne({
      transactionId: transaction._id,
      userId: userId,
      status: { $in: ['Pending', 'Open'] }
    });

    if (existingDispute) {
      return res.status(409).json({ message: 'Dispute already exists for this transaction' });
    }

    // ✅ Create the dispute
    const dispute = new disputeData({
      userId,
      disputeType,
      description,
      transactionId: transaction._id, // Use the transaction's _id
      status: 'Pending',
      disputeDate: new Date(),
      paymentCategory,
      amount: cleanedAmount,
      schoolId: schoolRecord._id,
      supportingDocuments
    });

    const savedDispute = await dispute.save();

    // Optionally: notify admins, log activity, etc.
    await sendNotification(user._id, 'Dispute creation', 'Dispute created successfully', 'success');

    

    res.status(201).json({
      message: 'Dispute created successfully',
      dispute: savedDispute
    });
  } catch (error) {
    console.error('Create Dispute Error:', error);
    res.status(500).json({
      message: 'An error occurred while creating the dispute',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

exports.getAllDisputes = async (req, res) => {
  try {
    const disputes = await disputeData.find({})
      .populate('transactionId')
      .populate('resolvedBy', 'fullName email') 
      .sort({ createdAt: -1 });
    res.status(200).json(disputes);
  } catch (error) {
    console.error('Error fetching all disputes:', error);
    res.status(500).json({ message: 'Server error' });
  }
};



exports.getSchoolDisputes = async (req, res) => {
    try {
      const userId = req.user?.id; // pulled from JWT
      if (!userId) {
        return res.status(401).json({ message: 'Unauthorized: No user ID found' });
      }
      // Check if user is a school
      const user = await regUser.findById(userId);
      if (!user || user.role !== 'school') {
        return res.status(403).json({ message: 'Unauthorized: User is not a school' });
      }
  
      const disputes = await disputeData.find({ userId, schoolId: user._id }) // Assuming the school ID is stored in the dispute
        .populate('transactionId')
        .populate('resolvedBy', 'fullName email')
        .sort({ createdAt: -1 });
  if(disputes.schoolID !== userId){
        return res.status(403).json({ message: 'Unauthorized: You can only view as a school' });
  }
  
      res.status(200).json(disputes);
    } catch (error) {
      console.error('Error fetching user disputes:', error);
      res.status(500).json({ message: 'Server error' });
    }
  };

  //get dispute raised by user
exports.getUserDisputes = async (req, res) => {
  try {
    const userId = req.user?.id; // pulled from JWT
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: No user ID found' });
    }
    // Check if user exists
    const user = await regUser.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
   
    // Fetch disputes raised by the user
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

//get dispute by id
exports.getDisputeById = async (req, res) => {
  try {
    const { id } = req.params;
    const dispute = await disputeData.findById(id)
      .populate('transactionId')
      .populate('resolvedBy', 'fullName email');
    if (!dispute) {

      return res.status(404).json({ message: 'Dispute not found' });
    }
    res.status(200).json(dispute);
  } catch (error) {
    console.error('Error fetching dispute by ID:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

//update dispute
exports.updateDispute = async (req, res) => {
  try {
    const userId = req.user?.id; // pulled from JWT
    if (!userId) {
      return res.status(401).json({ message: 'Unauthorized: No user ID found' });
    }
    // Check if user is a school
    const user = await regUser.findById(userId);
    if (!user || user.role !== 'school') {
      return res.status(403).json({ message: 'Unauthorized: User is not a school' });
    }
    const { id } = req.params;
    const { status } = req.body;
    //resolved date
    const dispute = await disputeData.findByIdAndUpdate(
      id,
      { status, resolvedBy:user._id, resolvedDate:Date.now() }, // Update the status and resolvedBy fields, and set resolvedDate to now
      { new: true }
    ).populate('transactionId').populate('resolvedBy', 'name email');
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }
    res.status(200).json({
      message: 'Dispute updated successfully',
      dispute
    });
  } catch (error) {
    console.error('Error updating dispute:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
//delete dispute
exports.deleteDispute = async (req, res) => {
  try {
    // const userId = req.user?.id; // pulled from JWT
    // if (!userId) {
    //   return res.status(401).json({ message: 'Unauthorized: No user ID found' });
    // }
    // // Check if user is a school
    // const user = await regUser.findById(userId);
    // if (!user || user.role !== 'school') {
    //   return res.status(403).json({ message: 'Unauthorized: User is not a school' });
    // }
    const { id } = req.params;
    const dispute = await disputeData.findByIdAndDelete(id);
    if (!dispute) {
      return res.status(404).json({ message: 'Dispute not found' });
    }
    res.status(200).json({
      message: 'Dispute deleted successfully',
      dispute
    });
  } catch (error) {
    console.error('Error deleting dispute:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
