const axios = require('axios');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const Transaction = require('../Models/transactionSchema'); // Import Transaction model
const {regUser} = require('../Models/registeration'); // Import User model
const Wallet = require('../Models/walletSchema'); // Import Wallet model
const Charge = require('../Models/charges'); // Import Charges model
const { generateReference} = require('../utils/generatereference');
const {sendNotification}  = require('../utils/notification');
const sendEmail = require('../utils/email');
// const verifyToken = require('../routes/verifyToken'); // Import verifyToken middleware





//Get all withdrawal wallet Transactions
exports.getAllWithdrawalTransactions = async (req, res) => {
  try {
    // Ensure the user is authenticated
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No user ID in token'
      });
    }
    //find charges wallet
    //find charges wallet
    const chargesWallet = await Wallet.findOne({ walletName: 'Withdrawal Charge Wallet' });
    // console.log("Charges Wallet:", chargesWallet);
    // Ensure the user is admin or school
    const user = await regUser.findById(userId);
    if (!user || (user.role !== 'admin' && user.role !== 'school')) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to access this resource'
      });
    }
    // Find all transactions with type 'withdrawal_completed'
    const transactions = await Transaction.find({ transactionType: 'withdrawal_completed' })
      .populate('senderWalletId')
      .populate('receiverWalletId')
      .sort({ createdAt: -1 }); // Optional: latest first

      //update the metadata with the wallet information
    transactions.forEach(tx => {
      if (tx.senderWalletId) {
        tx.metadata.chargesWalletName = chargesWallet.walletName; // Ensure charges wallet name is included
        tx.metadata.chargesBalance = chargesWallet.balance; // Ensure senderWalletId is included
        tx.metadata.transactionType= chargesWallet.lastTransactionType; // Include sender wallet balance
        tx.metadata.walletId = chargesWallet._id; // Include sender wallet type
        tx.metadata.currency = chargesWallet.currency; // Include sender wallet currency
      }
      if (tx.receiverWalletId) {
        tx.metadata.chargesWalletName = chargesWallet.walletName; // Ensure charges wallet name is included
        tx.metadata.chargesBalance = chargesWallet.balance; // Ensure senderWalletId is included
        tx.metadata.transactionType= chargesWallet.lastTransactionType; // Include sender wallet balance
        tx.metadata.walletId = chargesWallet._id; // Include sender wallet type
        tx.metadata.currency = chargesWallet.currency; // Include sender wallet currency
      }
    });
    res.status(200).json({
      success: true,
      message: `Total of ${transactions.length} withdrawal transactions retrieved successfully`,
      data: transactions
    });
  } catch (error) {
    console.error('Error fetching withdrawal transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching withdrawal transactions'
    });
  }
};
//Get all Topup wallet Transactions
exports.getAllTopupTransactions = async (req, res) => {
  try {
    // Ensure the user is authenticated
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No user ID in token'
      });
    }
    //find charges wallet
    const chargesWallet = await Wallet.findOne({ walletName: 'Topup Charge Wallet' });
    // console.log("Charges Wallet:", chargesWallet);
    // Ensure the user is admin or school
    const user = await regUser.findById(userId);
    if (!user || (user.role !== 'admin' && user.role !== 'school')) {
      return res.status(403).json({
        success: false,
        message: 'Forbidden: You do not have permission to access this resource'
      });
    }
    // Find all transactions with type 'withdrawal_completed'
    const transactions = await Transaction.find({ transactionType: 'wallet_topup' })
      .populate('senderWalletId')
      .populate('receiverWalletId')
      .sort({ createdAt: -1 }); // Optional: latest first

      //update the metadata with the wallet information
    transactions.forEach(tx => {
      if (tx.senderWalletId) {
        tx.metadata.chargesWalletName = chargesWallet.walletName; // Ensure charges wallet name is included
        tx.metadata.chargesBalance = chargesWallet.balance; // Ensure senderWalletId is included
        tx.metadata.transactionType= chargesWallet.lastTransactionType; // Include sender wallet balance
        tx.metadata.walletId = chargesWallet._id; // Include sender wallet type
        tx.metadata.currency = chargesWallet.currency; // Include sender wallet currency
      }
      if (tx.receiverWalletId) {
        tx.metadata.chargesWalletName = chargesWallet.walletName; // Ensure charges wallet name is included
        tx.metadata.chargesBalance = chargesWallet.balance; // Ensure senderWalletId is included
        tx.metadata.transactionType= chargesWallet.lastTransactionType; // Include sender wallet balance
        tx.metadata.walletId = chargesWallet._id; // Include sender wallet type
        tx.metadata.currency = chargesWallet.currency; // Include sender wallet currency
      }
    });
    res.status(200).json({
      success: true,
      message: `Total of ${transactions.length} withdrawal transactions retrieved successfully`,
      data: transactions
    });
  } catch (error) {
    console.error('Error fetching withdrawal transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching withdrawal transactions'
    });
  }
};
// Get all transactions
exports.getAllTransactions = async (req, res) => {
  try {
    const transactions = await Transaction.find()
      .populate('senderWalletId')
      .populate('receiverWalletId')
      .sort({ createdAt: -1 }); // Optional: latest first

    res.status(200).json({
      success: true,
      message: `Total of  ${transactions.length} Transactions retrieved successfully`,
      data: transactions
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions'
    });
  }
};

//get user transactions
// exports.getTransactionById = async (req, res) => {
//   try {
//     const userId = req.user?.id;

//     if (!userId) {
//       return res.status(401).json({
//         success: false,
//         message: 'Unauthorized: No user ID in token'
//       });
//     }

//     // Find the user's wallet
//     const wallet = await Wallet.findOne({ userId });
//     if (!wallet) {
//       return res.status(404).json({
//         success: false,
//         message: 'Wallet not found for the authenticated user'
//       });
//     }

//     // Find transactions where the user's wallet is either sender or receiver
//     const transactions = await Transaction.find({
//       $or: [
//         { senderWalletId: wallet._id },
//         { receiverWalletId: wallet._id }
//       ]
//     })
//       .populate('senderWalletId')
//       .populate('receiverWalletId')
//       .sort({ createdAt: -1 });

//     res.status(200).json({
//       success: true,
//       message: `Found ${transactions.length} transaction(s) for user`,
//       data: transactions
//     });
//   } catch (error) {
//     console.error('Error fetching transactions by token ID:', error.message);
//     res.status(500).json({
//       success: false,
//       message: 'Server error while fetching transactions'
//     });
//   }
// };
exports.getTransactionById = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No user ID in token'
      });
    }
    const userEmail = regUser.findById(userId).select('email').then(user => user.email);
    // Find the user's wallet
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found for the authenticated user'
      });
    }

    // Find transactions where:
    // - user is sender and transaction is debit (money sent)
    // - user is receiver and transaction is credit (money received)
    const transactions = await Transaction.find({
      $or: [
    // Normal debit: user sent money
    { senderWalletId: wallet._id, category: 'debit', transactionType: { $ne: 'reversal' } },

    // Normal credit: user received money
    { receiverWalletId: wallet._id, category: 'credit', transactionType: { $ne: 'reversal' } },

    // Reversal debit: user's wallet was debited (e.g., money taken back)
    { senderWalletId: wallet._id, category: 'credit', transactionType: 'reversal' },

    // Reversal credit: user's wallet was credited (e.g., money refunded)
    { senderWalletId: wallet._id, category: 'debit', transactionType: 'reversal' }
  ]
    })
      .populate('senderWalletId')
      .populate('receiverWalletId')
      .sort({ createdAt: -1 });

    // Optionally add direction field (debit/credit) for clarity
    const filteredTransactions = transactions.map(tx => {
      const isSender = tx.senderWalletId?._id.toString() === wallet._id.toString();
      return {
        ...tx.toObject(),
        direction: isSender ? 'debit' : 'credit'
      };
    });

    res.status(200).json({
      success: true,
      message: `Found ${filteredTransactions.length} transaction(s) for user`,
      data: filteredTransactions
    });
  } catch (error) {
    console.error('Error fetching transactions by token ID:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transactions'
    });
  }
};



// exports.getTransactionById = async (req, res) => {
//   try {
//     const userEmail = req.user?.email;
//     console.log(userEmail)

//     if (!userEmail) {
//       return res.status(401).json({
//         success: false,
//         message: 'Unauthorized: Missing user email'
//       });
//     }

//     // Find transactions where any email field in metadata matches user email
//     const transactions = await Transaction.find({
//       $or: [
//         { 'metadata.senderEmail': userEmail },
//         { 'metadata.receiverEmail': userEmail },
//         { 'metadata.email': userEmail }
//       ]
//     })
//       .populate('senderWalletId')
//       .populate('receiverWalletId')
//       .sort({ createdAt: -1 });

//     res.status(200).json({
//       success: true,
//       message: `Found ${transactions.length} transaction(s) for user email`,
//       data: transactions
//     });
//   } catch (error) {
//     console.error('Error fetching transactions by user email in metadata:', error.message);
//     res.status(500).json({
//       success: false,
//       message: 'Server error while fetching transactions'
//     });
//   }
// };

// exports.getTransactionById = async (req, res) => {
//   try {
//     const userId = req.user?.id;
//     const userEmail = req.user?.email;

//     if (!userId || !userEmail) {
//       return res.status(401).json({
//         success: false,
//         message: 'Unauthorized: No user ID or email in token'
//       });
//     }
//     const transactions = await Transaction.find({
//   $or: [
//     { 'metadata.senderEmail': userEmail },
//     { 'metadata.email': userEmail },
//     { 'metadata.receiverEmail': userEmail }
//   ]
// }).sort({ createdAt: -1 });


//     res.status(200).json({
//       success: true,
//       message: `Found ${transactions.length} matching transaction(s) for user`,
//       data: transactions
//     });
//   } catch (error) {
//     console.error('Error fetching filtered transactions:', error.message);
//     res.status(500).json({
//       success: false,
//       message: 'Server error while fetching transactions'
//     });
//   }
// };


// //get transaction for a particular school which includes all students in the school
// exports.getRecentTransactionsByToken = async (req, res) => {
//   try {
//     const userId = req.user?.id;

//     if (!userId) {
//       return res.status(401).json({
//         success: false,
//         message: 'Unauthorized: No user ID in token'
//       });
//     }

//     // Find the user's wallet
//     const wallet = await Wallet.findOne({ userId });
//     if (!wallet) {
//       return res.status(404).json({
//         success: false,
//         message: 'Wallet not found for the authenticated user'
//       });
//     }

//     // Find latest 5 transactions
//     const transactions = await Transaction.find({
//       $or: [
//         { senderWalletId: wallet._id },
//         { receiverWalletId: wallet._id }
//       ]
//     })
//       .populate('senderWalletId')
//       .populate('receiverWalletId')
//       .sort({ createdAt: -1 })
//       .limit(5); // Only the 5 most recent

//     res.status(200).json({
//       success: true,
//       message: `Found ${transactions.length} recent transaction(s)`,
//       data: transactions
//     });
//   } catch (error) {
//     console.error('Error fetching recent transactions:', error.message);
//     res.status(500).json({
//       success: false,
//       message: 'Server error while fetching recent transactions'
//     });
//   }
// };






exports.initiateTransaction = async (req, res) => {
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

  try {
    const { amount } = req.body;

    const userId = req.user?.id;
    console.log("User ID:", userId);
    //find Wallet by Name Topup charges
    const systemWalletId = process.env.SYSTEM_WALLET_ID; // Get system wallet ID from request body
    const userEmail = await regUser.findById(userId).select('email').then(user => user.email);

    console.log("User Email:", userEmail);

    if (!userId || !userEmail) {
      return res.status(401).json({ message: 'Unauthorized: user info not available' });
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }
    //fetch system wallets
    const systemWallet = await Wallet.findById(systemWalletId);
    if (!systemWallet) {
      return res.status(404).json({ message: 'System wallet not found' });
    }
   
    // get charges for topup
    const charge = await Charge.findOne({ name: 'Topup Charges' });
    if (!charge) {
      return res.status(404).json({ message: 'Topup Charge not found' });
    }
    // Calculate charge amount if charge type is Flat put the charge amount as is, if charge type is Percentage calculate the percentage of the amount not greater than 500
    let chargeAmount = 0;
    if (charge.chargeType === 'Flat') {
      chargeAmount = charge.amount;
    } else if (charge.chargeType === 'Percentage') {
      chargeAmount = Math.min((amount * charge.amount) / 100, 500);
    } else {
      return res.status(400).json({ message: 'Invalid charges type' });
    }
    

    // Fetch user's wallet
    const userWallet = await Wallet.findOne({ userId });
    if (!userWallet) {
      return res.status(404).json({ message: 'Wallet not found for this user' });
    }

    const balanceBefore = userWallet.balance || 0;
    const FRONTEND_URL_PROD = process.env.FRONTEND_URL_PROD || 'http://localhost:5174'; // Default to localhost if not set
    

    // Call Paystack to initialize transaction
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        amount: (amount + chargeAmount) * 100, // Paystack expects amount in kobo
        email: userEmail,
        callback_url: `${FRONTEND_URL_PROD}/payment/callback`, // Change to real callback
           metadata: {
            chargeAmount: chargeAmount*100, // Store charge in kobo
            topupAmount: amount*100, // Store topup amount in kobo
            initiatedBy: userId,
            email: userEmail,
            platform: 'web',

          },
      },
      {
        headers: {
          Authorization: `Bearer ${paystackSecretKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const { reference, authorization_url } = response.data.data;
    console.log("Paystack Response:", response.data);

    // Save pending transaction to DB
    await Transaction.create({
      senderWalletId: systemWallet._id,
      receiverWalletId: userWallet._id,
      transactionType: 'wallet_topup',
      category: 'credit',
      amount,
      balanceBefore,
      charges: chargeAmount,
      balanceAfter: balanceBefore, // Will update after verification
      reference,
      description: 'Wallet top-up via Paystack',
      status: 'pending',
      metadata: {
        initiatedBy: userId,
        email: userEmail,
        platform: 'web',
      }
    });

    res.status(200).json({ 
      "Message": response.data,
      authorization_url
    });

  } catch (error) {
    console.error('Error initiating transaction:', error.response?.data || error.message);
    res.status(500).json({
      message: 'Failed to initiate transaction',
      error: error.response?.data || error.message,
    });
  }
};


// exports.verifyTransaction = async (req, res) => {
//   try {
//     const reference = req.query.reference || req.params.reference;
    
//     if (!reference) {
//       return res.status(400).json({ status: false, message: 'Reference is required' });
//     }

//     const response = await axios.get(
//       `https://api.paystack.co/transaction/verify/${reference}`,
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
//           'Content-Type': 'application/json',
//         },
//       }
//     );

//     const data = response.data.data;

//     if (data.status === 'success' && data.paid_at) {
//       const userEmail = data.customer.email;

//       const user = await regUser.findOne({ email: userEmail });
// if (!user) {
//   return res.status(404).json({ status: false, message: 'User not found' });
// }

// const userWallet = await Wallet.findOne({ userId: user._id.toString(), type: 'user' });
// if (!userWallet) {
// //   console.log("User Wallet not found for userId:", user._id.toString());
// //   console.log("typeof user._id:", typeof user._id);
// // console.log("user._id constructor:", user._id.constructor.name);
// // console.log("user._id value:", user._id.valueOf());
//   return res.status(404).json({ status: false, message: 'Wallet not found' });
// }
//      const topupChargesWallet = await Wallet.findOne({ walletName: 'Topup Charge Wallet' });
//     if (!topupChargesWallet) {
//       return res.status(404).json({ message: 'Topup Charge Wallet not found' });
//     }

//       const amount = data.amount / 100;
//       const chargeAmount = data.metadata.chargeAmount/100 || 0;
//       const topupAmount = data.metadata.topupAmount/100 || amount - chargeAmount;
//       const balanceBefore = userWallet.balance;
//       const balanceAfter = balanceBefore + topupAmount;
//       // console.log("Balance Before:", balanceBefore);
//       // console.log("Balance After:", balanceAfter);
//       // 🟡 Find the existing pending transaction by reference
//       const existingTxn = await Transaction.findOne({ reference, status: 'pending' });
//       if (!existingTxn) {
//         return res.status(404).json({ status: false, message: 'Pending transaction not found' });
//       }

//       // ✅ Update wallet balance
//       userWallet.balance = balanceAfter;
//       //update topup charges wallet
//       topupChargesWallet = {
//         ...topupChargesWallet,
//         balance: topupChargesWallet.balance + chargeAmount,
//         lastTransaction: new Date(),
//         lastTransactionAmount: chargeAmount,
//         lastTransactionType: 'credit'
//       }
//       await userWallet.save();

//       // ✅ Update the transaction record
//       existingTxn.status = 'success';
//       existingTxn.charges = chargeAmount;
//       existingTxn.balanceAfter = balanceAfter;
//       existingTxn.updatedAt = new Date();
//       existingTxn.senderWalletId = userWallet._id;
//       existingTxn.receiverWalletId = userWallet._id;
//       await existingTxn.save();

//       return res.status(200).json({
//         status: true,
//         message: 'Payment verified, wallet funded, and transaction updated',
//         data
//       });

//     } else {
//       return res.status(400).json({
//         status: false,
//         message: `Transaction not completed. Status: ${data.status}`,
//         gateway_response: data.gateway_response,
//         data
//       });
//     }

//   } catch (err) {
//     console.error('Error verifying payment:', err.message);
//     return res.status(500).json({
//       status: false,
//       message: `Server error verifying payment: ${err.message}`,
//       error: err.response?.data || err.message
//     });
//   }
// };

// exports.getAllSchoolTransactions = async (req, res) => {
//   try {
//     const schoolId = req.user?.schoolId;

//     if (!schoolId) {
//       return res.status(401).json({
//         success: false,
//         message: 'Unauthorized: No school ID found in token'
//       });
//     }

//     // Find all students under the school
//     const students = await User.find({ role: 'student', schoolId }, '_id');

//     if (students.length === 0) {
//       return res.status(200).json({
//         success: true,
//         message: 'No students found for this school',
//         data: []
//       });
//     }

//     const studentIds = students.map(student => student._id);

//     // Get all wallets for those students
//     const wallets = await Wallet.find({ userId: { $in: studentIds } }, '_id');
//     const walletIds = wallets.map(wallet => wallet._id);

//     // Find transactions where sender or receiver is among those wallets
//     const transactions = await Transaction.find({
//       $or: [
//         { senderWalletId: { $in: walletIds } },
//         { receiverWalletId: { $in: walletIds } }
//       ]
//     })
//       .populate('senderWalletId')
//       .populate('receiverWalletId')
//       .sort({ createdAt: -1 });

//     res.status(200).json({
//       success: true,
//       message: `${transactions.length} transaction(s) found for school`,
//       data: transactions
//     });
//   } catch (error) {
//     console.error('Error fetching school transactions:', error.message);
//     res.status(500).json({
//       success: false,
//       message: 'Error fetching transactions for school'
//     });
//   }
// };

exports.verifyTransaction = async (req, res) => {
  try {
    const reference = req.query.reference || req.params.reference;

    if (!reference) {
      return res.status(400).json({ status: false, message: 'Reference is required' });
    }

    const response = await axios.get(
      `https://api.paystack.co/transaction/verify/${reference}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const data = response.data.data;

    if (data.status === 'success' && data.paid_at) {
      const userEmail = data.customer.email;
      const user = await regUser.findOne({ email: userEmail });
      if (!user) {
        return res.status(404).json({ status: false, message: 'User not found' });
      }

      const userWallet = await Wallet.findOne({ userId: user._id.toString(), type: 'user' });
      if (!userWallet) {
        return res.status(404).json({ status: false, message: 'Wallet not found' });
      }

      const topupChargesWallet = await Wallet.findOne({ walletName: 'Topup Charge Wallet' });
      if (!topupChargesWallet) {
        return res.status(404).json({ message: 'Topup Charge Wallet not found' });
      }

      const amount = data.amount / 100;

      const metadata = data.metadata || {};
      const chargeAmount = metadata.chargeAmount ? metadata.chargeAmount / 100 : 0;
      const topupAmount = metadata.topupAmount ? metadata.topupAmount / 100 : amount - chargeAmount;

      const balanceBefore = userWallet.balance;
      const balanceAfter = balanceBefore + topupAmount;

      const existingTxn = await Transaction.findOne({ reference, status: 'pending' });
      if (!existingTxn) {
        return res.status(404).json({ status: false, message: 'Pending transaction not found' });
      }

      // ✅ Update user wallet balance
      userWallet.balance = balanceAfter;
      await userWallet.save();

      // ✅ Update topup charges wallet balance and info
      topupChargesWallet.balance += chargeAmount;
      topupChargesWallet.lastTransaction = new Date();
      topupChargesWallet.lastTransactionAmount = chargeAmount;
      topupChargesWallet.lastTransactionType = 'credit';
      await topupChargesWallet.save();

      // ✅ Update transaction
      existingTxn.status = 'success';
      existingTxn.charges = chargeAmount;
      existingTxn.balanceAfter = balanceAfter;
      existingTxn.updatedAt = new Date();
      existingTxn.senderWalletId = userWallet._id;
      existingTxn.receiverWalletId = userWallet._id;
      await existingTxn.save();

      //log credit transaction for wallet
      await Transaction.create({
        senderWalletId: userWallet._id,
        receiverWalletId: topupChargesWallet._id,
        transactionType: 'wallet_topup',
        category: 'credit',
        amount: topupAmount,
        balanceBefore: topupChargesWallet.balance,
        balanceAfter: topupChargesWallet.balance + topupAmount,
        reference: generateReference('TPCH'),
        description: 'Wallet top-up via Paystack',
        status: 'success',
        metadata: {
          initiatedBy: user._id,
          email: userEmail,
          platform: 'web',
          chargeAmount: chargeAmount * 100, // Store charge in kobo
          topupAmount: topupAmount * 100, // Store topup amount in kobo
        }

      })
      //send notification to user
      await sendNotification(user._id, `Your wallet has been credited with ${topupAmount}. New balance is ${balanceAfter}.`);

      //send email to user
      await sendEmail({
        to: user.email, 
        subject: 'Wallet Top-up Successful', 
        html: `Your wallet has been credited with ${topupAmount}. New balance is ${balanceAfter}.`
    });

      return res.status(200).json({
        status: true,
        message: 'Payment verified, wallet funded, and transaction updated',
        data
      });

    } else {
      return res.status(400).json({
        status: false,
        message: `Transaction not completed. Status: ${data.status}`,
        gateway_response: data.gateway_response,
        data
      });
    }

  } catch (err) {
    console.error('Error verifying payment:', err.message);
    return res.status(500).json({
      status: false,
      message: `Server error verifying payment: ${err.message}`,
      error: err.response?.data || err.message
    });
  }
};

const getTransferCharge = async (userId) => {
  const user = await regUser.findById(userId);
  if (!user) {
    throw new Error('User not found');
  }

  const charge = await Charge.findOne({ name: 'Transfer Charges' });
  if (!charge) {
    throw new Error('Transfer Charges not found');
  }

  return charge;
};
exports.verifyPinAndTransfer = async (req, res) => {
  const senderId = req.user?.id;
  const { receiverEmail, amount, pin, description = 'No description provided' } = req.body;

  const failTransaction = async (reason, extra = {}) => {
    try {
      const senderWallet = senderId ? await Wallet.findOne({ userId: senderId }) : null;
      const receiverWallet = receiverEmail
        ? await Wallet.findOne({ userId: (await regUser.findOne({ email: receiverEmail }))?._id })
        : null;
  
      if (senderWallet) {
        await new Transaction({
          senderWalletId: senderWallet._id,
          receiverWalletId: receiverWallet?._id,
          transactionType: 'wallet_transfer_sent',
          category: 'debit',
          amount: amount || 0,
          balanceBefore: senderWallet.balance,
          balanceAfter: senderWallet.balance,
          reference: `TRX-${uuidv4()}`,
          description,
          status: 'failed',
          metadata: {
            reason,
            ...(receiverEmail ? { receiverEmail } : { receiverEmail: 'No recipient email provided' }),
            ...extra
          }
        }).save();
      }
    } catch (err) {
      console.error('Error saving failed transaction:', err.message);
    }
  };
  

  try {
    const sender = await regUser.findById(senderId);
    if (!sender) {
      await failTransaction('Sender not found', { reason: 'Sender account does not exist' });
      return res.status(404).json({ error: 'Sender not found' });
    }

    if (!sender.pin) {
      await failTransaction('PIN not set', { reason: 'Sender has not set a PIN' });
      return res.status(400).json({ error: 'PIN not set' });
    }

    const isPinValid = await bcrypt.compare(pin, sender.pin);
    if (!isPinValid) {
      await failTransaction('Invalid PIN', { reason: 'Provided PIN is incorrect' });
      return res.status(400).json({ error: 'Invalid PIN' });
    }

    const receiver = await regUser.findOne({ email: receiverEmail });
    if (!receiver) {
      await failTransaction('Receiver not found', { reason: 'No user with this email', receiverEmail });
      return res.status(404).json({ error: 'Receiver not found ' });
    }

    const senderWallet = await Wallet.findOne({ userId: sender._id });
    const receiverWallet = await Wallet.findOne({ userId: receiver._id });

    if (!senderWallet || !receiverWallet) {
      await failTransaction('Wallet(s) not found', {
        reason: 'Either sender or receiver wallet is missing',
        senderWalletFound: !!senderWallet,
        receiverWalletFound: !!receiverWallet
      });
      return res.status(400).json({ error: 'Wallet(s) not found' });
    }
    //get transfer charges wallet
    const transferCharge = await Charge.findOne({name: "Transfer Charges"});
    if(!transferCharge){
      return res.status(404).json({error: "Transfer Charges not found"});
    }
    // Calculate charge amount if charge type is Flat put the charge amount as is, if charge type is Percentage calculate the percentage of the amount not greater than 500
    let chargeAmount = 0;
    if (transferCharge.chargeType === 'Flat') {
      chargeAmount = transferCharge.amount;
    } else if (transferCharge.chargeType === 'Percentage') {
      chargeAmount = Math.min((amount * transferCharge.amount) / 100, 500);
    }
    //Total Amount to be deducted from sender
    const totalDeduction = amount + chargeAmount;
    if (senderWallet.balance < totalDeduction) {
      await failTransaction('Insufficient balance', {
        reason: 'Sender does not have enough funds',
        currentBalance: senderWallet.balance,
        transferAmount: amount
      });
      return res.status(400).json({ error: 'Insufficient balance' });
    }
// find transfer charges wallet
    const transferChargesWallet = await Wallet.findOne({ walletName: 'Transfer Charges Wallet' });
    if (!transferChargesWallet) {
      return res.status(404).json({ message: 'Transfer Charge Wallet not found' });
    }
    // find transfer charges for school
    // const transferCharge = await getTransferCharge(senderId);
    // if (!transferCharge) {
    //   return res.status(404).json({ error: 'Transfer Charges not found' });
    // }
    // const chargeAmount = transferCharge.chargeType === 'Flat' ? transferCharge.amount : Math.min((amount * transferCharge.amount) / 100, 500);
    // Transfer funds
    const senderBalanceBefore = senderWallet.balance;
    const senderBalanceAfter = senderWallet.balance - totalDeduction;
    const receiverBalanceBefore = receiverWallet.balance;
    const receiverBalanceAfter = receiverWallet.balance + amount;
    //update transfer charges wallet
    transferChargesWallet.balance += chargeAmount;
    transferChargesWallet.lastTransaction = new Date();
    transferChargesWallet.lastTransactionAmount = chargeAmount;
    transferChargesWallet.lastTransactionType = 'credit';
    await transferChargesWallet.save();


    senderWallet.balance = senderBalanceAfter;
    receiverWallet.balance = receiverBalanceAfter;

    await senderWallet.save();
    await receiverWallet.save();

    const senderTransaction = new Transaction({
      senderWalletId: senderWallet._id,
      receiverWalletId: receiverWallet._id,
      transactionType: 'wallet_transfer_sent',
      category: 'debit',
      amount,
      balanceBefore: senderBalanceBefore,
      balanceAfter: senderBalanceAfter,
      reference: `TRX-${uuidv4()}`,
      description,
      status: 'success',
      metadata: {
        receiverEmail: receiver.email,
        senderEmail: sender.email,
        chargeAmount
      }
    });

    const receiverTransaction = new Transaction({
      senderWalletId: senderWallet._id,
      receiverWalletId: receiverWallet._id,
      transactionType: 'wallet_transfer_received',
      category: 'credit',
      amount,
      balanceBefore: receiverBalanceBefore,
      balanceAfter: receiverBalanceAfter,
      reference: `TRX-${uuidv4()}`,
      description,
      status: 'success',
      metadata: {
        senderEmail: sender.email,
        receiverEmail: receiver.email
      }
    });

    //log transfer charge transaction
    const chargeTransaction = new Transaction({
      senderWalletId: senderWallet._id,
      receiverWalletId: transferChargesWallet._id,
      transactionType: 'transfer_charge',
      category: 'debit',
      amount: chargeAmount,
      balanceBefore: senderBalanceAfter + chargeAmount,
      balanceAfter: senderBalanceAfter,
      reference: `TRX-${uuidv4()}`,
      description: `Transfer charge for sending ${amount} to ${receiver.email}`,
      status: 'success',
      metadata: {
        senderEmail: sender.email,
        receiverEmail: receiver.email,
        chargeAmount
      }
    });
    //log charge transaction for transfer charges wallet
    const chargeTransactionForChargeWallet = new Transaction({
      senderWalletId: senderWallet._id,
      receiverWalletId: transferChargesWallet._id,
      transactionType: 'transfer_charge',
      category: 'credit',
      amount: chargeAmount,
      balanceBefore: transferChargesWallet.balance - chargeAmount,
      balanceAfter: transferChargesWallet.balance,
      reference: `TRX-${uuidv4()}`,
      description: `Transfer charge received from ${sender.email} for sending ${amount} to ${receiver.email}`,
      status: 'success',
      metadata: {
        senderEmail: sender.email,
        receiverEmail: receiver.email,
        chargeAmount
      }
    });
    await chargeTransactionForChargeWallet.save(); 
    await chargeTransaction.save();
    // console.log("Receievr email:", receiver.email);
    // console.log("Sender email:", sender.email);
    const senderEmail = sender?.email;
    console.log("Sender email:", senderEmail);

    await senderTransaction.save();
    await receiverTransaction.save();

    //send notification to sender
    await sendNotification(sender._id, `You have sent ${amount} to ${receiver.email}. New balance is ${senderBalanceAfter}.`);
    //send notification to receiver
    //send email to sender
   const emailResponse =await sendEmail({
      to: senderEmail, 
      subject:'Transfer Successful', 
      html: `You have sent ${amount} to ${receiverEmail}. New balance is ${senderBalanceAfter}.`
  });
    //send email to receiver
    await sendEmail({
      to: receiverEmail, 
      subject: 'Transfer Received', 
      html: `You have received ${amount} from ${senderEmail}. New balance is ${receiverBalanceAfter}.`});

    res.json({
      message: 'Transfer successful',
      transaction: {
        amount,
        sender: sender.email,
        receiver: receiver.email,
        description,
        senderTransactionRef: senderTransaction.reference,
        receiverTransactionRef: receiverTransaction.reference
      }
    });
  } catch (error) {
    console.error(error);
    await failTransaction('Unexpected error', { reason: error.message });
    res.status(500).json({ error: error.message });
  }
};

exports.verifyPinAndTransferToAgent = async (req, res) => {
  const receiverId = req.user?.id;
  const { senderEmail, amount, pin, description = 'No description provided' } = req.body;

  const failTransaction = async (reason, extra = {}) => {
    try {
      const receiverWallet = receiverId ? await Wallet.findOne({ userId: receiverId }) : null;
      const senderWallet = senderEmail
        ? await Wallet.findOne({ userId: (await regUser.findOne({ email: senderEmail }))?._id })
        : null;
  
      if (senderWallet) {
        await new Transaction({
          senderWalletId: senderWallet._id,
          receiverWalletId: receiverWallet?._id,
          transactionType: 'wallet_transfer_sent',
          category: 'debit',
          amount: amount || 0,
          balanceBefore: senderWallet.balance,
          balanceAfter: senderWallet.balance,
          reference: `TRX-${uuidv4()}`,
          description,
          status: 'failed',
          metadata: {
            reason,
            ...(senderEmail ? { senderEmail } : { senderEmail: 'No recipient email provided' }),
            ...extra
          }
        }).save();
      }
    } catch (err) {
      console.error('Error saving failed transaction:', err.message);
    }
  };
  

  try {
    const sender = await regUser.findOne({email: senderEmail});
    if (!sender) {
      await failTransaction('Sender not found', { reason: 'Sender account does not exist' });
      return res.status(404).json({ error: 'Sender not found' });
    }

    if (!sender.pin) {
      await failTransaction('PIN not set', { reason: 'Sender has not set a PIN' });
      return res.status(400).json({ error: 'PIN not set' });
    }

    const isPinValid = await bcrypt.compare(pin, sender.pin);
    if (!isPinValid) {
      await failTransaction('Invalid PIN', { reason: 'Provided PIN is incorrect' });
      return res.status(400).json({ error: 'Invalid PIN' });
    }

    const receiver = await regUser.findById(receiverId);
    if (!receiver) {
      await failTransaction('Receiver not found', { reason: 'No user with this email', receiveremail });
      return res.status(404).json({ error: 'Receiver not found ' });
    }

    const senderWallet = await Wallet.findOne({ userId: sender._id });
    const receiverWallet = await Wallet.findOne({ userId: receiver._id });

    if (!senderWallet || !receiverWallet) {
      await failTransaction('Wallet(s) not found', {
        reason: 'Either sender or receiver wallet is missing',
        senderWalletFound: !!senderWallet,
        receiverWalletFound: !!receiverWallet
      });
      return res.status(400).json({ error: 'Wallet(s) not found' });
    }

    if (senderWallet.balance < amount) {
      await failTransaction('Insufficient balance', {
        reason: 'Sender does not have enough funds',
        currentBalance: senderWallet.balance,
        transferAmount: amount
      });
      return res.status(400).json({ error: 'Insufficient balance' });
    }

    // Transfer funds
    const senderBalanceBefore = senderWallet.balance;
    const senderBalanceAfter = senderWallet.balance - amount;
    const receiverBalanceBefore = receiverWallet.balance;
    const receiverBalanceAfter = receiverWallet.balance + amount;

    senderWallet.balance = senderBalanceAfter;
    receiverWallet.balance = receiverBalanceAfter;

    await senderWallet.save();
    await receiverWallet.save();

    const senderTransaction = new Transaction({
      senderWalletId: senderWallet._id,
      receiverWalletId: receiverWallet._id,
      transactionType: 'wallet_transfer_sent',
      category: 'debit',
      amount,
      balanceBefore: senderBalanceBefore,
      balanceAfter: senderBalanceAfter,
      reference: `TRX-${uuidv4()}`,
      description,
      status: 'success',
      metadata: {
        receiverEmail: receiver.email,
        senderEmail: sender.email,
      }
    });

    const receiverTransaction = new Transaction({
      senderWalletId: senderWallet._id,
      receiverWalletId: receiverWallet._id,
      transactionType: 'wallet_transfer_received',
      category: 'credit',
      amount,
      balanceBefore: receiverBalanceBefore,
      balanceAfter: receiverBalanceAfter,
      reference: `TRX-${uuidv4()}`,
      description,
      status: 'success',
      metadata: {
        senderEmail: sender.email,
        receiverEmail: receiver.email
      }
    });

    await senderTransaction.save();
    await receiverTransaction.save();

    //send notification to sender
    await sendNotification(sender._id, `You have sent ${amount} to ${receiver.email} with email: ${receiver.email}. New balance is ${senderBalanceAfter}.`);
    //send notification to receiver
    await sendNotification(receiver._id, `You have received ${amount} from ${sender.name} with email: ${sender.email}. New balance is ${receiverBalanceAfter}.`);
    //send email to sender
    await sendEmail(
      {
        to: sender.email, 
        subject: 'Transfer Successful', 
        html:`You have sent ${amount} to ${receiver.name} with email: ${receiver.email}. New balance is ${senderBalanceAfter}.`
  });
    //send email to receiver
    await sendEmail(
      {
      to: receiver.email, 
      subject: 'Transfer Received', 
      html: `You have received ${amount} from ${sender.name} with email: ${sender.email}. New balance is ${receiverBalanceAfter}.`
    });

    res.json({
      message: 'Transfer successful',
      transaction: {
        amount,
        sender: sender.email,
        receiver: receiver.email,
        description,
        senderTransactionRef: senderTransaction.reference,
        receiverTransactionRef: receiverTransaction.reference
      }
    });
  } catch (error) {
    console.error(error);
    await failTransaction('Unexpected error', { reason: error.message });
    res.status(500).json({ error: error.message });
  }
};

  

exports.updateTransferMetadata = async (req, res) => {
  try {
    // Find all relevant transactions and populate userId inside the wallets
    const transactions = await Transaction.find({
      transactionType: { $in: ['wallet_transfer_sent', 'wallet_transfer_received'] }
    })
      .populate({
        path: 'senderWalletId',
        populate: {
          path: 'userId',
          model: 'User'
        }
      })
      .populate({
        path: 'receiverWalletId',
        populate: {
          path: 'userId',
          model: 'User'
        }
      });

    let updatedCount = 0;

    for (const tx of transactions) {
      const metadata = tx.metadata || {};

      const senderUser = tx.senderWalletId?.userId;
      console.log('userID', metadata.senderEmail)
      const receiverUser = tx.receiverWalletId?.userId;
      console.log('userID', senderUser.email)


      let needsUpdate = false;

      // Add senderEmail if missing
      if (!metadata.senderEmail && senderUser?.email) {
        metadata.senderEmail = senderUser.email;
        needsUpdate = true;
      }

      // Add receiverEmail if missing
      if (!metadata.receiverEmail && receiverUser?.email) {
        metadata.receiverEmail = receiverUser.email;
        needsUpdate = true;
      }

      if (needsUpdate) {
        tx.metadata = metadata;
        await tx.save();
        updatedCount++;
      }
    }

    return res.status(200).json({
      success: true,
      message: `Metadata updated for ${updatedCount} transaction(s)`,
      tx
    });

  } catch (error) {
    console.error('Error updating transaction metadata:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Server error while updating transaction metadata'
    });
  }
};

//Delete Transaction
exports.deleteTransaction = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Transaction.findByIdAndDelete(id);
    if (!deleted) {
      return res.status(404).json({
        success: false,
        message: `Transaction with ID ${id} not found`
      });
    }

    res.status(200).json({
      success: true,
      message: `Transaction ${id} deleted successfully`,
      data: deleted
    });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({
      success: false,
      message: 'Server error while deleting transaction'
    });
  }
};

// Reverse an unlogged transaction
exports.reverseUnloggedTransaction = async (req, res) => {
  try {
    const { senderEmail, receiverEmail, amount, reason } = req.body;

    if (!senderEmail || !receiverEmail || !amount || !reason) {
      return res.status(400).json({
        success: false,
        message: 'Sender email, receiver email, amount, and reason are required'
      });
    }

    const numericAmount = Number(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Amount must be a valid positive number'
      });
    }

    const senderUser = await regUser.findOne({ email: senderEmail });
    const receiverUser = await regUser.findOne({ email: receiverEmail });

    if (!senderUser || !receiverUser) {
      return res.status(404).json({
        success: false,
        message: 'Sender or receiver not found'
      });
    }

    const senderWallet = await Wallet.findOne({ userId: senderUser._id });
    const receiverWallet = await Wallet.findOne({ userId: receiverUser._id });

    if (!senderWallet || !receiverWallet) {
      return res.status(404).json({
        success: false,
        message: 'Sender or receiver wallet not found'
      });
    }

    if (receiverWallet.balance < numericAmount) {
      return res.status(400).json({
        success: false,
        message: "Insufficient balance in receiver's wallet"
      });
    }

    // Perform reversal
    receiverWallet.balance -= numericAmount;
    senderWallet.balance += numericAmount;

    await receiverWallet.save();
    await senderWallet.save();

    // Log debit (receiver) and credit (sender)
    const debitTransaction = new Transaction({
      senderWalletId: receiverWallet._id,
      receiverWalletId: senderWallet._id,
      transactionType: 'reversal',
      category: 'debit',
      amount: numericAmount,
      balanceBefore: receiverWallet.balance + numericAmount,
      balanceAfter: receiverWallet.balance,
      reference: `REV-${uuidv4()}`,
      description: `Reversal: ${receiverEmail} to ${senderEmail}`,
      status: 'success',
      metadata: { reason, senderEmail, receiverEmail }
    });

    const creditTransaction = new Transaction({
      senderWalletId: senderWallet._id,
      receiverWalletId: receiverWallet._id,
      transactionType: 'reversal',
      category: 'credit',
      amount: numericAmount,
      balanceBefore: senderWallet.balance - numericAmount,
      balanceAfter: senderWallet.balance,
      reference: `REV-${uuidv4()}`,
      description: `Reversal: ${receiverEmail} to ${senderEmail}`,
      status: 'success',
      metadata: { reason, senderEmail: receiverEmail, receiverEmail: senderEmail }
    });

    await debitTransaction.save();
    await creditTransaction.save();

    res.status(200).json({
      success: true,
      message: 'Unlogged transaction reversed successfully',
      data: {
        debitTransaction,
        creditTransaction
      }
    });
  } catch (error) {
    console.error('Error reversing unlogged transaction:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while reversing transaction'
    });
  }
};
