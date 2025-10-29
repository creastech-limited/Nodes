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

    //send email to Admins
    const adminEmail = "itsupport@creastech" // Ensure this is set in your environment variables
    await sendEmail(
      adminEmail, 
      'New Dispute Created', 
      `A new dispute has been created by ${user.name}. Dispute ID: ${savedDispute._id}. Please review it in the admin panel.`
    );
    

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

      const disputesWithUserNames = await Promise.all(
        disputes.map(async (dispute) => {
          const raisedByUser = await regUser.findById(dispute.userId);
          return {
            ...dispute.toObject(),
            raisedByName: raisedByUser ? raisedByUser.name : 'Unknown User',
            raisedByEmail: raisedByUser ? raisedByUser.email : 'Unknown Email'  
          };
        })
      );
      if (disputesWithUserNames.length === 0) {
        return res.status(404).json({ message: 'No disputes found for this school' });
      }
    // Return the disputes with user names
   res.status(200).json({
        message: `${disputesWithUserNames.length} Dispute(s) fetched successfully`,
        disputes: disputesWithUserNames
      
      });
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
      console.log('User ID:', userId);
      // Check if user is a school
      const user = await regUser.findById(userId);
      if (!user || user.role !== 'school') {
        return res.status(403).json({ message: 'Unauthorized: User is not a school' });
      }
      console.log('User found:', user._id);
      //convert userId to string
      const userIdString = user._id.toString();
      console.log('User ID String:', userIdString);
  
      const disputes = await disputeData.find({ schoolId: userIdString }) // Assuming the school ID is stored in the dispute
        .populate('transactionId')
        .populate('resolvedBy', 'fullName email')
        .sort({ createdAt: -1 });

      // Check if disputes were found
  if (!disputes || disputes.length === 0) {
        return res.status(404).json({ message: 'No disputes found for this school' });
      }
  //       console.log('Disputes found:', disputes.disputeType );
  //       console.log('Disputes count:', disputes.schoolId === user._id);
  // if(disputes.schoolId !== user.id){
  //       return res.status(403).json({ message: 'Unauthorized: You can only view as a school' });
  // }
  //get the name of the user who raised the dispute
      if (!disputes || disputes.length === 0) {
        return res.status(404).json({ message: 'No disputes found for this school' });
      }
      const disputesWithUserNames = await Promise.all(
        disputes.map(async (dispute) => {
          const raisedByUser = await regUser.findById(dispute.userId);
          return {
            ...dispute.toObject(),
            raisedByName: raisedByUser ? raisedByUser.name : 'Unknown User',
            raisedByEmail: raisedByUser ? raisedByUser.email : 'Unknown Email'  
          };
        })
      );
      if (disputesWithUserNames.length === 0) {
        return res.status(404).json({ message: 'No disputes found for this school' });
      }
  
      res.status(200).json({
        message: `${disputesWithUserNames.length} Dispute(s) fetched successfully`,
        disputes: disputesWithUserNames
      
      });
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

    //get the name of the user who raised the dispute
    const disputesWithUserNames = await Promise.all(
      disputes.map(async (dispute) => {
        const raisedByUser = await regUser.findById(dispute.userId);
        return {
          ...dispute.toObject(),
          raisedBy: raisedByUser ? raisedByUser.name : 'Unknown User'
        };
      })
    );
    if (disputesWithUserNames.length === 0) {
      return res.status(404).json({ message: 'No disputes found for this user' });
    }
    // Return the disputes with user names

    res.status(200).json({
      message: `$(disputesWithUserNames.lenght) Disputes fetched successfully`,
      disputes: disputesWithUserNames
        });
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
    //get the name of the user who raised the dispute
      if (!disputes || disputes.length === 0) {
        return res.status(404).json({ message: 'No disputes found for this school' });
      }
      const disputesWithUserNames = await Promise.all(
        disputes.map(async (dispute) => {
          const raisedByUser = await regUser.findById(dispute.userId);
          return {
            ...dispute.toObject(),
            raisedBy: raisedByUser ? raisedByUser.name : 'Unknown User'
          };
        })
      );
      if (disputesWithUserNames.length === 0) {
        return res.status(404).json({ message: 'No disputes found for this school' });
      }
  
      res.status(200).json({
        message: 'Disputes fetched successfully',
        disputes: disputesWithUserNames
      
      });

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
    //get the name of the user who raised the dispute
      if (!dispute || dispute.length === 0) {
        return res.status(404).json({ message: 'No disputes found for this school' });
      }
      const disputesWithUserNames = await Promise.all(
        dispute.map(async (dispute) => {
          const raisedByUser = await regUser.findById(dispute.userId);
          return {
            ...dispute.toObject(),
            raisedBy: raisedByUser ? raisedByUser.name : 'Unknown User'
          };
        })
      );
      if (disputesWithUserNames.length === 0) {
        return res.status(404).json({ message: 'No disputes found for this school' });
      }
      // Optionally: notify user about dispute resolution
      await sendNotification(dispute.userId, 'Dispute Update', `Your dispute has been updated to status: ${status}`, 'info');

      //send email to user about dispute resolution
      const raisedByUser = await regUser.findById(dispute.userId);
      if (raisedByUser) {
        await sendEmail(
          raisedByUser.email,
          'Dispute Status Updated',
          `Hello ${raisedByUser.name},\n\nYour dispute with ID: ${dispute._id} has been updated to status: ${status}.\n\nThank you.`
        );
      }
  
      res.status(200).json({
        message: 'Disputes fetched successfully',
        disputes: disputesWithUserNames
      
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
    //get the name of the user who raised the dispute
      if (!disputes || disputes.length === 0) {
        return res.status(404).json({ message: 'No disputes found for this school' });
      }
      const disputesWithUserNames = await Promise.all(
        disputes.map(async (dispute) => {
          const raisedByUser = await regUser.findById(dispute.userId);
          return {
            ...dispute.toObject(),
            raisedBy: raisedByUser ? raisedByUser.name : 'Unknown User'
          };
        })
      );
      if (disputesWithUserNames.length === 0) {
        return res.status(404).json({ message: 'No disputes found for this school' });
      }
  
      res.status(200).json({
        message: 'Disputes fetched successfully',
        disputes: disputesWithUserNames
      
      });
  } catch (error) {
    console.error('Error deleting dispute:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
