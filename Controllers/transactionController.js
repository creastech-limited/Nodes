const cron = require("node-cron");
// import cron from "node-cron";
const https = require("https");
const axios = require('axios');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const {Transaction, TransactionLimit, PaystackDedicatedAccount} = require('../Models/transactionSchema'); // Import Transaction model
const {regUser} = require('../Models/registeration'); // Import User model
const Wallet = require('../Models/walletSchema'); // Import Wallet model
const Charge = require('../Models/charges'); // Import Charges model
const { generateReference} = require('../utils/generatereference');
const {sendNotification}  = require('../utils/notification');
const sendEmail = require('../utils/email');
const {generateNombaToken} = require('../utils/generatenombatoken');
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
    const userInfo = await regUser.findById(userId);
    const userEmail = await regUser.findById(userId).select('email').then(user => user.email);

    // console.log("User Email:", userEmail);

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
    let charge = await Charge.findOne({
        name: `${userInfo.schoolName} Funding Charge`,
        schoolId: userInfo.schoolId
      });

      if (!charge) {
        charge = await Charge.findOne({
          name: 'TopUp Charges',
        });
      }
      if (!charge) {
        return res.status(404).json({ message: 'Topup Charge not found' });
      }
console.log(charge.chargeType)
    // Calculate charge amount if charge type is Flat put the charge amount as is, if charge type is Percentage calculate the percentage of the amount not greater than 500
    let chargeAmount = 0;

if (charge.chargeType === 'Flat') {
    chargeAmount = charge.amount;

    } 
    else if (charge.chargeType === 'Percentage') {

    let computedPercent = 0;
    if (amount > 0 && amount <= 50000) {
        computedPercent = (amount * (charge.amount || 0)) / 100;
    } 
    else if (amount > 50000 && amount <= 150000) {
        computedPercent = (amount * (charge.amount2 || 0)) / 100;
    } 
    else if (amount > 150000) {
        computedPercent = (amount * (charge.amount3 || 0)) / 100;
    } 
    else {
        return res.status(400).json({ message: "Invalid amount value" });
    }
    chargeAmount = Math.min(computedPercent, 2500);

} else {
    return res.status(400).json({ message: 'Invalid charge type' });
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
        callback_url: callBackUrl, // Change to real callback
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
    // const paystack = process.env.PAYSTACK_SECRET_KEY;
    // console.log(paystack)

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

      //log credit transaction for topup wallet
      await Transaction.create({
        senderWalletId: userWallet._id,
        receiverWalletId: topupChargesWallet._id,
        transactionType: 'wallet_topup',
        category: 'credit',
        amount: chargeAmount,
        balanceBefore: topupChargesWallet.balance,
        balanceAfter: topupChargesWallet.balance + chargeAmount,
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
    //   await sendEmail({
    //     to: user.email, 
    //     subject: 'Wallet Top-up Successful', 
    //     html: `Your wallet has been credited with ${topupAmount}. New balance is ${balanceAfter}.`
    // });

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
    if(sender.email === receiverEmail){
      await failTransaction('Self-transfer not allowed', { reason: 'Sender and receiver emails are the same' });
      return res.status(400).json({ error: 'You cannot transfer to yourself' });
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
    const chargesBalanceBefore = transferChargesWallet.balance
    const chargesBalanceAfter = transferChargesWallet.balance+chargeAmount
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
   const emailResponse =await sendEmail(
      senderEmail, 
      'Transfer Successful', 
      `You have sent ${amount} to ${receiverEmail}. New balance is ${senderBalanceAfter}.`
  );
    //send email to receiver
    // await sendEmail({
    //   to: receiverEmail, 
    //   subject: 'Transfer Received', 
    //   html: `You have received ${amount} from ${senderEmail}. New balance is ${receiverBalanceAfter}.`});

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

// exports.verifyPinAndTransferToAgent = async (req, res) => {
//   const receiverId = req.user?.id;
//   const { senderEmail, amount, pin, description = 'No description provided' } = req.body;

//   const failTransaction = async (reason, extra = {}) => {
//     try {
//       const receiverWallet = receiverId ? await Wallet.findOne({ userId: receiverId }) : null;
//       const senderWallet = senderEmail
//         ? await Wallet.findOne({ userId: (await regUser.findOne({ email: senderEmail }))?._id })
//         : null;
  
//       if (senderWallet) {
//         await new Transaction({
//           senderWalletId: senderWallet._id,
//           receiverWalletId: receiverWallet?._id,
//           transactionType: 'wallet_transfer_sent',
//           category: 'debit',
//           amount: amount || 0,
//           balanceBefore: senderWallet.balance,
//           balanceAfter: senderWallet.balance,
//           reference: `TRX-${uuidv4()}`,
//           description,
//           status: 'failed',
//           metadata: {
//             reason,
//             ...(senderEmail ? { senderEmail } : { senderEmail: 'No recipient email provided' }),
//             ...extra
//           }
//         }).save();
//       }
//     } catch (err) {
//       console.error('Error saving failed transaction:', err.message);
//     }
//   };
  

//   try {
//     const sender = await regUser.findOne({email: senderEmail});
//     if (!sender) {
//       await failTransaction('Sender not found', { reason: 'Sender account does not exist' });
//       return res.status(404).json({ error: 'Sender not found' });
//     }

//     if (!sender.pin) {
//       await failTransaction('PIN not set', { reason: 'Sender has not set a PIN' });
//       return res.status(400).json({ error: 'PIN not set' });
//     }

//     const isPinValid = await bcrypt.compare(pin, sender.pin);
//     if (!isPinValid) {
//       await failTransaction('Invalid PIN', { reason: 'Provided PIN is incorrect' });
//       return res.status(400).json({ error: 'Invalid PIN' });
//     }

//     const receiver = await regUser.findById(receiverId);
//     if (!receiver) {
//       await failTransaction('Receiver not found', { reason: 'No Receiver found' });
//       return res.status(404).json({ error: 'Receiver not found ' });
//     }

//     const senderWallet = await Wallet.findOne({ userId: sender._id });
//     const receiverWallet = await Wallet.findOne({ userId: receiver._id });

//     if (!senderWallet || !receiverWallet) {
//       await failTransaction('Wallet(s) not found', {
//         reason: 'Either sender or receiver wallet is missing',
//         senderWalletFound: !!senderWallet,
//         receiverWalletFound: !!receiverWallet
//       });
//       return res.status(400).json({ error: 'Wallet(s) not found' });
//     }
//      const transferCharge = await Charge.findOne({name: "Transfer Charges"});
//     if(!transferCharge){
//       return res.status(404).json({error: "Transfer Charges not found"});
//     }
//     // Calculate charge amount if charge type is Flat put the charge amount as is, if charge type is Percentage calculate the percentage of the amount not greater than 500
//     let chargeAmount = 0;
//     if (transferCharge.chargeType === 'Flat') {
//       chargeAmount = transferCharge.amount;
//     } else if (transferCharge.chargeType === 'Percentage') {
//       chargeAmount = Math.min((amount * transferCharge.amount) / 100, 500);
//     }
//     if (senderWallet.balance < amount) {
//       await failTransaction('Insufficient balance', {
//         reason: 'Sender does not have enough funds',
//         currentBalance: senderWallet.balance,
//         transferAmount: amount
//       });
//       return res.status(400).json({ error: 'Insufficient balance' });
//     }
//     //Total Amount to be deducted from sender
//     const totalDeduction = amount + chargeAmount;
//     if (senderWallet.balance < totalDeduction) {
//       await failTransaction('Insufficient balance', {
//         reason: 'Sender does not have enough funds',
//         currentBalance: senderWallet.balance,
//         transferAmount: amount
//       });
//       return res.status(400).json({ error: 'Insufficient balance' });
//     }
// // find transfer charges wallet
//     const transferChargesWallet = await Wallet.findOne({ walletName: 'Transfer Charges Wallet' });
//     if (!transferChargesWallet) {
//       return res.status(404).json({ message: 'Transfer Charge Wallet not found' });
//     }
//     // Transfer funds
//     const senderBalanceBefore = senderWallet.balance;
//     const senderBalanceAfter = senderWallet.balance - totalDeduction;
//     const receiverBalanceBefore = receiverWallet.balance;
//     const receiverBalanceAfter = receiverWallet.balance + amount;

//     senderWallet.balance = senderBalanceAfter;
//     receiverWallet.balance = receiverBalanceAfter;

//     //update transfer charges wallet
//     transferChargesWallet.balance += chargeAmount;
//     transferChargesWallet.lastTransaction = new Date();
//     transferChargesWallet.lastTransactionAmount = chargeAmount;
//     transferChargesWallet.lastTransactionType = 'credit';


//     await transferChargesWallet.save();
//     await senderWallet.save();
//     await receiverWallet.save();

//     const senderTransaction = new Transaction({
//       senderWalletId: senderWallet._id,
//       receiverWalletId: receiverWallet._id,
//       transactionType: 'wallet_transfer_sent',
//       category: 'debit',
//       amount,
//       balanceBefore: senderBalanceBefore,
//       balanceAfter: senderBalanceAfter,
//       reference: `TRX-${uuidv4()}`,
//       description,
//       status: 'success',
//       metadata: {
//         receiverEmail: receiver.email,
//         senderEmail: sender.email,
//       }
//     });

//     const receiverTransaction = new Transaction({
//       senderWalletId: senderWallet._id,
//       receiverWalletId: receiverWallet._id,
//       transactionType: 'wallet_transfer_received',
//       category: 'credit',
//       amount,
//       balanceBefore: receiverBalanceBefore,
//       balanceAfter: receiverBalanceAfter,
//       reference: `TRX-${uuidv4()}`,
//       description,
//       status: 'success',
//       metadata: {
//         senderEmail: sender.email,
//         receiverEmail: receiver.email
//       }
//     });

//     await senderTransaction.save();
//     await receiverTransaction.save();

//     //log transfer charge transaction
//     const chargeTransaction = new Transaction({
//       senderWalletId: senderWallet._id,
//       receiverWalletId: transferChargesWallet._id,
//       transactionType: 'transfer_charge',
//       category: 'debit',
//       amount: chargeAmount,
//       balanceBefore: senderBalanceAfter + chargeAmount,
//       balanceAfter: senderBalanceAfter,
//       reference: `TRX-${uuidv4()}`,
//       description: `Transfer charge for sending ${amount} to ${receiver.email}`,
//       status: 'success',
//       metadata: {
//         senderEmail: sender.email,
//         receiverEmail: receiver.email,
//         chargeAmount
//       }
//     });
//     //log charge transaction for transfer charges wallet
//     const chargeTransactionForChargeWallet = new Transaction({
//       senderWalletId: senderWallet._id,
//       receiverWalletId: transferChargesWallet._id,
//       transactionType: 'transfer_charge',
//       category: 'credit',
//       amount: chargeAmount,
//       balanceBefore: transferChargesWallet.balance - chargeAmount,
//       balanceAfter: transferChargesWallet.balance,
//       reference: `TRX-${uuidv4()}`,
//       description: `Transfer charge received from ${sender.email} for sending ${amount} to ${receiver.email}`,
//       status: 'success',
//       metadata: {
//         senderEmail: sender.email,
//         receiverEmail: receiver.email,
//         chargeAmount
//       }
//     });
//     await chargeTransactionForChargeWallet.save(); 
//     await chargeTransaction.save();

//     //send notification to sender
//     await sendNotification(sender._id, `You have sent ${amount} to ${receiver.email} with email: ${receiver.email}. New balance is ${senderBalanceAfter}.`);
//     //send notification to receiver
//     await sendNotification(receiver._id, `You have received ${amount} from ${sender.name} with email: ${sender.email}. New balance is ${receiverBalanceAfter}.`);
//     //send email to sender
//   //   await sendEmail(
//   //     {
//   //       to: sender.email, 
//   //       subject: 'Transfer Successful', 
//   //       html:`You have sent ${amount} to ${receiver.name} with email: ${receiver.email}. New balance is ${senderBalanceAfter}.`
//   // });
//     //send email to receiver
//     // await sendEmail(
//     //   {
//     //   to: receiver.email, 
//     //   subject: 'Transfer Received', 
//     //   html: `You have received ${amount} from ${sender.name} with email: ${sender.email}. New balance is ${receiverBalanceAfter}.`
//     // });

//     res.json({
//       message: 'Transfer successful',
//       transaction: {
//         amount,
//         sender: sender.email,
//         receiver: receiver.email,
//         description,
//         senderTransactionRef: senderTransaction.reference,
//         receiverTransactionRef: receiverTransaction.reference
//       }
//     });
//   } catch (error) {
//     console.error(error);
//     await failTransaction('Unexpected error', { reason: error.message });
//     res.status(500).json({ error: error.message });
//   }
// };


exports.verifyPinAndTransferToAgent = async (req, res) => {
  const receiverId = req.user?.id;
  const { senderEmail, amount, pin, description = "No description provided" } = req.body;
  const numericAmount = Number(amount);
  const receiver = await regUser.findById(receiverId);
    if (!receiver) return res.status(401).json({ error: "Receiver not found" });
    const receiverEmail = receiver.email;

  const failTransaction = async (reason, extra = {}) => {
    try {
      const receiverWallet = receiverId ? await Wallet.findOne({ userId: receiverId }) : null;
      const sender = senderEmail ? await regUser.findOne({ email: senderEmail }) : null;
      const senderWallet = sender ? await Wallet.findOne({ userId: sender._id }) : null;

      if (senderWallet) {
        await new Transaction({
          senderWalletId: senderWallet._id,
          receiverWalletId: receiverWallet?._id,
          transactionType: "wallet_transfer_sent",
          category: "debit",
          amount: numericAmount || 0,
          balanceBefore: senderWallet.balance,
          balanceAfter: senderWallet.balance,
          reference: `TRX-${uuidv4()}`,
          description,
          status: "failed",
          metadata: { reason, senderEmail: senderEmail || "N/A", ...extra },
        }).save();
      }
    } catch (err) {
      console.error("Error saving failed transaction:", err.message);
    }
  };

  try {
    const sender = await regUser.findOne({ email: senderEmail });
    if (!sender) return res.status(402).json({ error: "Sender not found" });

    if (!sender.pin) return res.status(403).json({ error: "PIN not set" });
    const isPinValid = await bcrypt.compare(pin, sender.pin);
    if (!isPinValid) return res.status(404).json({ error: "Invalid PIN" });
    if (sender.email === receiverEmail) {
      return res.status(411).json({ error: "You cannot transfer to yourself" });
      
    }

    

    const senderWallet = await Wallet.findOne({ userId: sender._id });
    const receiverWallet = await Wallet.findOne({ userId: receiver._id });
    if (!senderWallet || !receiverWallet)
      return res.status(407).json({ error: "Wallet(s) not found" });

    // ✅ Check Transaction Limits for Students
    let limit;
    if (sender.role === "student") {
      limit = await TransactionLimit.findOne({ studentId: sender._id });
      if (!limit)
        return res.status(406).json({ error: "Transaction limit not set for this student" });

      // Per Transaction Check
      if (numericAmount > limit.perTransactionLimit)
        return res
          .status(400)
          .json({ error: `You cannot send more than ${limit.perTransactionLimit} per transaction` });

      // Daily Check
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date();
      todayEnd.setHours(23, 59, 59, 999);

      const todayTransactions = await Transaction.aggregate([
        {
          $match: {
            senderWalletId: senderWallet._id,
            createdAt: { $gte: todayStart, $lte: todayEnd },
            status: "success",
            category: "debit", // ✅ only count sent transactions
          },
        },
        //sum the amount and trasnfer charges
        { $group: { 
          _id: null, 
          totalSent: { $sum:{$add:["$amount", "$transferCharges"]} } }
        }
        ,
      ]);

      const totalSentToday = todayTransactions[0]?.totalSent || 0;
      console.log("Total sent today:", totalSentToday);

      if (totalSentToday + numericAmount > limit.dailyLimit)
        return res
          .status(400)
          .json({ error: `Daily limit exceeded. Limit: ${limit.dailyLimit}, Sent: ${totalSentToday}` });

      // Weekly Check
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay());
      startOfWeek.setHours(0, 0, 0, 0);

      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      const weeklyTransactions = await Transaction.aggregate([
  {
    $match: {
      senderWalletId: senderWallet._id,
      createdAt: { $gte: startOfWeek, $lte: endOfWeek },
      status: "success",
      category: "debit",
    },
  },
  {
    $group: {
      _id: null,
      totalSent: {
        $sum: {
          $add: ["$amount", "$transferCharges"]
        }
      }
    }
  }
]);


      const totalSentWeek = weeklyTransactions[0]?.totalSent || 0;
      console.log("Total sent this week:", totalSentWeek);

      if (totalSentWeek + numericAmount > limit.weeklyLimit)
        return res
          .status(413)
          .json({ error: `Weekly limit exceeded. Limit: ${limit.weeklyLimit}, Sent: ${totalSentWeek}` });
    }

    // ✅ Transfer Charges
    const transferCharge = await Charge.findOne({ name: "Transfer Charges" });
    if (!transferCharge) return res.status(408).json({ error: "Transfer Charges not found" });

    let chargeAmount = 0;
    if (transferCharge.chargeType === "Flat") chargeAmount = transferCharge.amount;
    else if (transferCharge.chargeType === "Percentage")
      chargeAmount = Math.min((numericAmount * transferCharge.amount) / 100, 500);

    const totalDeduction = numericAmount + chargeAmount;
    if (senderWallet.balance < totalDeduction)
      return res.status(414).json({ error: "Insufficient balance" });

    // ✅ Process Transaction
    const transferChargesWallet = await Wallet.findOne({ walletName: "Transfer Charges Wallet" });
    if (!transferChargesWallet)
      return res.status(409).json({ message: "Transfer Charge Wallet not found" });

    const senderBalanceBefore = senderWallet.balance;
    const senderBalanceAfter = senderBalanceBefore - totalDeduction;
    const receiverBalanceBefore = receiverWallet.balance;
    const receiverBalanceAfter = receiverBalanceBefore + numericAmount;

    senderWallet.balance = senderBalanceAfter;
    receiverWallet.balance = receiverBalanceAfter;
    transferChargesWallet.balance += chargeAmount;
    transferChargesWallet.lastTransaction = new Date();
    transferChargesWallet.lastTransactionAmount = chargeAmount;
    transferChargesWallet.lastTransactionType = "credit";

    await Promise.all([
      transferChargesWallet.save(),
      senderWallet.save(),
      receiverWallet.save(),
    ]);

    // ✅ Update Transaction Limit
    if (sender.role === "student" && limit) {
      limit.currentDailySpent += numericAmount + chargeAmount;
      limit.currentWeeklySpent += numericAmount + chargeAmount;
      await limit.save();
    }

    // ✅ Log Transactions
    const senderTransaction = new Transaction({
      senderWalletId: senderWallet._id,
      receiverWalletId: receiverWallet._id,
      transactionType: "wallet_transfer_sent",
      category: "debit",
      amount: numericAmount,
      balanceBefore: senderBalanceBefore,
      balanceAfter: senderBalanceAfter,
      reference: `TRX-${uuidv4()}`,
      description,
      status: "success",
      metadata: { receiverEmail: receiver.email, senderEmail: sender.email },
    });

    const receiverTransaction = new Transaction({
      senderWalletId: senderWallet._id,
      receiverWalletId: receiverWallet._id,
      transactionType: "wallet_transfer_received",
      category: "credit",
      amount: numericAmount,
      balanceBefore: receiverBalanceBefore,
      balanceAfter: receiverBalanceAfter,
      reference: `TRX-${uuidv4()}`,
      description,
      status: "success",
      metadata: { senderEmail: sender.email, receiverEmail: receiver.email },
    });

    //log transfer charge transaction
    const chargeTransaction = new Transaction({
      senderWalletId: senderWallet._id,
      receiverWalletId: transferChargesWallet._id,
      transactionType: 'transfer_charge',
      category: 'debit',
      amount: chargeAmount,
      balanceBefore: senderBalanceAfter,
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

    await Promise.all([senderTransaction.save(), receiverTransaction.save(),chargeTransactionForChargeWallet.save(),chargeTransaction.save()]);

    // ✅ Send Notifications
    await sendNotification(sender._id, `You sent ₦${numericAmount} to ${receiver.email}. New balance: ₦${senderBalanceAfter}`);
    await sendNotification(receiver._id, `You received ₦${numericAmount} from ${sender.name}. New balance: ₦${receiverBalanceAfter}`);
    //if the user has guardian email, send Notifications to guardian
    const guardianEmailAddr = sender?.guardian.email;
    const guardian = regUser.findOne({email: guardianEmailAddr});
    console.log("Guardian email:", guardianEmailAddr);
    if(sender.guardianEmail){
      await sendNotificationToGuardian(guardian._id, `Your ward ${sender.name} sent ₦${numericAmount} to ${receiver.email}. New balance: ₦${senderBalanceAfter}`);   
    await sendEmail(
      guardianEmailAddr,
      "Transfer Successful",
      `${sender.name} have sent ₦${numericAmount} to ${receiver.name}. New balance is ₦${senderBalanceAfter}.`,
    );
    }
    await sendEmail(
      sender.email,
      "Transfer Successful",
      `You have sent ₦${numericAmount} to ${receiver.email}. New balance is ₦${senderBalanceAfter}.`,
    );
    await sendEmail( 
      receiver.email,
      "Transfer Received",
      `You have received ₦${numericAmount} from ${sender.name}. New balance is ₦${receiverBalanceAfter}.`,
    );

    res.json({
      message: "Transfer successful",
      transaction: {
        amount: numericAmount,
        sender: sender.email,
        receiver: receiver.email,
        description,
        senderRef: senderTransaction.reference,
        receiverRef: receiverTransaction.reference,
      },
    });
  } catch (error) {
    console.error("Error in verifyPinAndTransferToAgent:", error);
    await failTransaction("Unexpected error", { reason: error.message });
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

// controllers/transactionLimitController.js
exports.setTransactionLimit = async (req, res) => {
  try {
    const { studentId, dailyLimit, perTransactionLimit, weeklyLimit } = req.body;
    const parentId = req.user.id; // from JWT
    if (!studentId || dailyLimit == null || perTransactionLimit == null || weeklyLimit == null) {
      return res.status(400).json({ error: "All fields are required" });
    }
    if (dailyLimit < 0 || perTransactionLimit < 0 || weeklyLimit < 0) {
      return res.status(400).json({ error: "Limits must be non-negative values" });
    }
    

    let limit = await TransactionLimit.findOne({ studentId, parentId });

    if (limit) {
      limit.dailyLimit = dailyLimit;
      limit.perTransactionLimit = perTransactionLimit;
      limit.weeklyLimit = weeklyLimit;
      await limit.save();
    } else {
      limit = await TransactionLimit.create({
        studentId,
        parentId,
        dailyLimit,
        perTransactionLimit,
        weeklyLimit,
      });
    }

    res.json({ success: true, message: "Transaction limit set successfully", limit });
  } catch (err) {
    console.error("Error setting limit:", err);
    res.status(500).json({ error: "Failed to set transaction limit" });
  }
};
//update transaction limit
exports.updateTransactionLimit = async (req, res) => {
  try {
    const { studentId } = req.params;
    const { dailyLimit, perTransactionLimit, weeklyLimit } = req.body;
    const parentId = req.user.id;

    const limit = await TransactionLimit.findOneAndUpdate(
      { studentId: studentId },
      { dailyLimit, perTransactionLimit, weeklyLimit },
      { new: true }
    );
    if (!limit) return res.status(404).json({ message: "Transaction limit not found" });
    res.json({ success: true, message: "Transaction limit updated successfully", limit });
  } catch (err) {
    res.status(500).json({ error: "Failed to update transaction limit" });
  }
}; 

// get transaction limit for a student
exports.getTransactionLimit = async (req, res) => {
  try {
    const { studentId } = req.params;
    const parentId = req.user.id;

    const limit = await TransactionLimit.findOne({ studentId, parentId });
    if (!limit) return res.status(404).json({ message: "No limit found for this student" });

    res.json(limit);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch transaction limit" });
  }
};

//get all transaction limits set by a parent
exports.getAllTransactionLimits = async (req, res) => {
  try {
    const parentId = req.user.id;
    const limits = await TransactionLimit.find({ parentId });
    res.json(limits);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch transaction limits" });
  }
};
//get limit by id
exports.getLimitById = async (req, res) => {
  try {
    const id = req.user?.id;
    if (!id) return res.status(400).json({ message: "User ID is required" });
    const user = await regUser.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });
    // if (user.role !== 'parent' && user.role !== 'school') {
    //   return res.status(403).json({ message: "Only Parents can access their transaction limits" });
    // }
    const { studentId } = req.params;
    // console.log("Fetching limit for student ID:", studentId);
    const student = await regUser.findById(studentId);
    if (!student) return res.status(404).json({ message: "Student not found" });
    // console.log("Fetching limit for student ID:", student.name);
    const limit = await TransactionLimit.findOne({studentId});
    if (!limit) return res.status(404).json({ message: "Transaction limit not found" });
    res.json(limit);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch transaction limit" });
  }
};

//get all transaction limits
exports.getAllLimits = async (req, res) => {
  try {
    const limits = await TransactionLimit.find();
    res.status(200).json({
      message: limits.length,
      limits
    });
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch transaction limits" });
  }
};

//delete transaction limit
exports.deleteTransactionLimit = async (req, res) => {
  try {
    const { id } = req.params;
    const parentId = req.user.id;
    const limit = await TransactionLimit.findOneAndDelete({ _id: id, parentId });
    if (!limit) return res.status(404).json({ message: "Transaction limit not found" });
    res.json({ message: "Transaction limit deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete transaction limit" });
  }
};

//
exports.setDefaultLimitForAllStudents = async (req, res) => {
  try {
    const students = await regUser.find({ role: "student" });

    let createdCount = 0;
    for (const student of students) {
      const exists = await TransactionLimit.findOne({ studentId: student._id });
      if (!exists) {
        await TransactionLimit.create({
          studentId: student._id,
          dailyLimit: 5000,
          weekLyLimit: 500000,
        });
        createdCount++;
      }
    }

    res.status(200).json({
      success: true,
      message: `Default transaction limit set for ${createdCount} students.`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

//delete all transaction limits
exports.deleteAllTransactionLimits = async (req, res) => {
  try {
    await TransactionLimit.deleteMany({});
    res.json({ message: "All transaction limits deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: "Failed to delete transaction limits" });
  }
};
// ✅ Reset Daily Limits — every day at midnight
cron.schedule("0 0 * * *", async () => {
  try {
    const now = new Date();
    const result = await TransactionLimit.updateMany(
      {},
      { $set: { currentDailySpent: 0, lastResetDate: now} }
    );
    console.log(`Daily limits reset for ${result.nModified} students at midnight.`);
  } catch (error) {
    console.error("Error resetting daily limits:", error);
  }
});

// ✅ Reset Weekly Limits — every Sunday at midnight
cron.schedule("0 0 * * 0", async () => {
  try {
    const now = new Date();
    const result = await TransactionLimit.updateMany(
      {},
      { $set: { currentWeeklySpent: 0, lastResetDate: now } }
    );
    console.log(`Weekly limits reset for ${result.nModified} students at midnight on Sunday.`);
  }
  catch (error) {
    console.error("Error resetting weekly limits:", error);
  }
});

// POST /api/paystack/create-dedicated-account

exports.createPaystackDedicatedAccount = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: "Unauthorized: User ID missing" });

    const customer = await regUser.findById(userId);
    if (!customer) return res.status(404).json({ error: "User not found" });

    const existingAccount = await PaystackDedicatedAccount.findOne({ userId });
    console.log(existingAccount)
    if (existingAccount) return res.status(400).json({ error: "Dedicated account already exists for this user" });

    const customerEmail = customer.email;
    const firstName = customer.firstName || "FirstName";
    const lastName = customer.lastName || "LastName";
    const { preferredBank } = req.body;
    const bank = preferredBank || process.env.PREFERRED_BANK || "test-bank";

    const params = JSON.stringify({
      customer: customerEmail,
      first_name: firstName,
      last_name: lastName,
      preferred_bank: bank,
      metadata: { userId, firstName, lastName },
    });

    const options = {
      hostname: "api.paystack.co",
      port: 443,
      path: "/dedicated_account",
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
    };

    const request = https.request(options, (response) => {
      let data = "";

      response.on("data", (chunk) => { data += chunk; });

      response.on("end", async () => {
        try {
          const parsed = JSON.parse(data);

          if (parsed.status && parsed.data) {
            const accountData = parsed.data;
            const newAccountInfo = {
               dedicatedAccountId: accountData.id,
              accountNumber: accountData.account_number,
              bankName: accountData.bank?.name || "Test Bank",
              bankCode: accountData.bank?.code || "000",
              accountName: accountData.account_name || `${firstName} ${lastName}`,
              currency: accountData.currency || "NGN",
            }
            console.log("New Dedicated Account Info:", newAccountInfo);
            
            const newAccount = new PaystackDedicatedAccount({
                userId,
                dedicatedAccountId: newAccountInfo.dedicatedAccountId,
                accountNumber: newAccountInfo.accountNumber,
                bankName: newAccountInfo.bankName,
                bankCode: newAccountInfo.bankCode || "000", // fallback
                accountName: newAccountInfo.accountName,
              });

              await newAccount.save();
            return res.status(response.statusCode).json(parsed);
          }

          res.status(400).json({ error: "Failed to create dedicated account", details: parsed });
        } catch (err) {
          console.error("JSON parse / save error:", err);
          res.status(500).json({ error: "Failed to parse or save Paystack response", details: err.message });
        }
      });
    });

    request.on("error", (err) => {
      console.error("HTTPS request error:", err);
      res.status(500).json({ error: "Paystack request failed", details: err.message });
    });

    request.write(params);
    request.end();

  } catch (error) {
    console.error("Unexpected error:", error);
    res.status(500).json({ error: "Something went wrong", details: error.message });
  }
};

//list all paystack dedicated accounts
exports.listPaystackDedicatedAccounts = async (req, res) => {
  try {
    const options = {
      hostname: 'api.paystack.co',
      port: 443,
      path: '/dedicated_account', // endpoint to list all dedicated accounts
      method: 'GET',
      headers: {
        Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
    };

    const request = https.request(options, (response) => {
      let data = '';

      response.on('data', (chunk) => {
        data += chunk;
      });

      response.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          res.status(response.statusCode).json(parsed);
        } catch (err) {
          console.error('JSON parse error:', err);
          res.status(500).json({ error: 'Failed to parse Paystack response' });
        }
      });
    });

    request.on('error', (err) => {
      console.error('HTTPS request error:', err);
      res.status(500).json({ error: 'Paystack request failed' });
    });

    request.end();
  } catch (error) {
    console.error('Unexpected error:', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
};

//nomba initiate transfer
// exports.initiateNombaPayment = async (req, res) => {
//   try {
//     const userId = req.user?.id;
//     if (!userId)
//       return res.status(401).json({ status: false, message: "Unauthorized: User ID missing" });
    
//     const { amount, email } = req.body;

//     if (!amount || !email)
//       return res.status(400).json({ status: false, message: "Amount and email required" });

//     const reference = "XPAY_" + Date.now();

//     const payload = {
//       order: {
//         amount: amount * 100,    // amount in kobo
//         currency: "NGN",
//         description: "Wallet Top-up"
//       },
//       reference: reference,
//       redirectUrl: "https://xpay.ng/payment/callback",
//       customer: {
//         email: email
//       },
//       metadata: {
//         userId,
//         topupAmount: amount,
//         initiatedBy: "wallet_topup"
//       }
//     };

//     const response = await axios.post(
//       "https://sandbox.nomba.com/v1/checkout/session",
//       payload,
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.NOMBA_SECRET_KEY}`,
//           "Content-Type": "application/json"
//         }
//       }
//     );
//     console.log("Nomba Init Response:", response);
//     return res.status(200).json({
//       status: true,
//       message: "Payment initialized",
//       checkoutUrl: response.data?.data?.checkoutUrl,
//       reference
//     });

//   } catch (error) {
//     console.error("Nomba Init Error:", error.response?.data || error.message);
//     return res.status(500).json({
//       status: false,
//       message: "Error initializing payment",
//       error: error.response?.data || error.message
//     });
//   }
// };

// exports.initiateNombaPayment = async (req, res) => {
//   try {
//     const userId = req.user?.id;
//     if (!userId) return res.status(401).json({ status: false, message: "Unauthorized: User ID missing" });
    
//     const { amount, email } = req.body;
//     if (!amount || !email) return res.status(400).json({ status: false, message: "Amount and email required" });

//     const reference = "XPAY_" + Date.now();

//     const payload = {
//       order: {
//         amount: amount * 100,  // amount in kobo
//         currency: "NGN",
//         description: "Wallet Top-up"
//       },
//       reference,
//       redirectUrl: "https://xpay.ng/payment/callback",
//       customer: { email },
//       metadata: { userId, topupAmount: amount, initiatedBy: "wallet_topup" }
//     };

//     const response = await axios.post(
//       "https://sandbox.nomba.com/v1/checkout/order",
//       payload,
//       {
//         headers: {
//           Authorization: `Bearer ${process.env.NOMBA_SECRET_KEY}`,
//           "Content-Type": "application/json"
//         }
//       }
//     );

//     return res.status(200).json({
//       status: true,
//       message: "Payment initialized",
//       checkoutUrl: response.data?.data?.checkoutUrl,
//       reference
//     });

//   } catch (error) {
//     console.error("Nomba Init Error:", error.response?.data || error.message);
//     return res.status(500).json({
//       status: false,
//       message: "Error initializing payment",
//       error: error.response?.data || error.message
//     });
//   }
// };

exports.initiateNombaPayment = async (req, res) => {
  try {
    const {
      email, 
      amount,
      callBackUrl
     } = req.body;
    const userId = req.user?.id;

    if (!amount || amount <= 0) {
      return res.status(400).json({ message: "Valid amount is required" });
    }
    if(!callBackUrl){
        return res.status(400).json({ message: "Valid call back URL is required" });

    }
    
    const user = await regUser.findById(userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const userWallet = await Wallet.findOne({ userId });
    if (!userWallet) return res.status(404).json({ message: "Wallet not found" });

    const systemWallet = await Wallet.findById(process.env.SYSTEM_WALLET_ID);
    if (!systemWallet) return res.status(404).json({ message: "System wallet not found" });

    const balanceBefore = userWallet.balance || 0;

    // -----------------------
    // 1. CALCULATE CHARGES
    // -----------------------
    let charge = await Charge.findOne({ 
      name: `${user.schoolName} Funding Charge`, 
      schoolId: user.schoolId 
    });

    if (!charge) charge = await Charge.findOne({ name: 'Topup Charges' });

    if (!charge) {
      return res.status(404).json({ message: 'Topup Charge not found' });
    }

    let chargeAmount = 0;

    if (charge.chargeType === "Flat") {
      chargeAmount = charge.amount;
    } else if (charge.chargeType === "Percentage") {
      let computedPercent;

      if (amount <= 50000) {
        computedPercent = (amount * (charge.amount || 0)) / 100;
      } else if (amount <= 150000) {
        computedPercent = (amount * (charge.amount2 || 0)) / 100;
      } else {
        computedPercent = (amount * (charge.amount3 || 0)) / 100;
      }

      chargeAmount = Math.min(computedPercent, 2500);
    }
// console.log("Secret Key:", process.env.PROD_NOMBA_SECRET_KEY);
    // -----------------------
    // 2. CALL NOMBA INIT API
    // -----------------------

    const token = await generateNombaToken();
    const totalAmount = amount +chargeAmount
    console.log(charge.amount)
    // console.log(token)
    const nombaResponse = await axios.post(
          "https://sandbox.nomba.com/v1/checkout/order",
          {
            order: {
              orderReference: crypto.randomUUID(),
              customerId: user._id.toString(),
              customerEmail: user.email || email,
              amount: totalAmount.toFixed(2),
              currency: "NGN",
              // callbackUrl: `${process.env.FRONTEND_URL_PROD}/nomba/callback`,
              callbackUrl: callBackUrl,
              accountId: process.env.NOMBA_ACCOUNT_ID
            },
            tokenizeCard: true
          },
          {
            headers: {
              accountId: process.env.NOMBA_ACCOUNT_ID,
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json"
            }
          }
        );
    const { checkoutLink, orderReference } = nombaResponse.data.data;

    // -----------------------
    // 3. SAVE TRANSACTION AS PENDING
    // -----------------------
    await Transaction.create({
      senderWalletId: systemWallet._id,
      receiverWalletId: userWallet._id,
      transactionType: "wallet_topup",
      category: "credit",
      amount,
      charges: chargeAmount,
      balanceBefore,
      balanceAfter: balanceBefore,
      reference: orderReference,
      description: "Wallet top-up via Nomba",
      status: "pending",
      metadata: {
        initiatedBy: userId,
        platform: "web"
      }
    });
    console.log("checkoutLink:", checkoutLink )
    res.status(200).json({
      message: "Nomba payment initiated",
      checkoutLink,
      orderReference
    });

  } catch (error) {
    console.error("Nomba Init Error:", error.response?.data || error.message);

    res.status(500).json({
      message: "Failed to initiate Nomba payment",
      error: error.response?.data || error.message
    });
  }
};


exports.verifyNombaTransaction = async(req, res) => {
  try {
    const { reference } = req.params;
    const userId = req.user?.id
    const user = await regUser.findById(userId)
    if(!user){
      return res.status(400).json({
         status: false,
        message: "user not found"
      })
    }

    if (!reference) {
      return res.status(400).json({
        status: false,
        message: "Order reference is required"
      });
    }

    // 1. Get transaction from DB
    const transaction = await Transaction.findOne({ reference });

    if (!transaction) {
      return res.status(404).json({
        status: false,
        message: "Transaction not found"
      });
    }

    // Prevent double processing
    if (transaction.status === "success") {
      return res.status(200).json({
        status: true,
        message: "Transaction already processed",
        transaction
      });
    }

    if (transaction.status === "expired") {
      return res.status(200).json({
        status: true,
        message: "Transaction expired",
        transaction
      });
    }

    if (transaction.status === "failed") {
      return res.status(400).json({
        status: false,
        message: "Transaction already marked as failed",
        transaction
      });
    }
     const topupChargesWallet = await Wallet.findOne({ walletName: 'Topup Charge Wallet' });
      if (!topupChargesWallet) {
        return res.status(404).json({ message: 'Topup Charge Wallet not found' });
      }

    // 2. Generate Nomba token
    const token = await generateNombaToken();
      console.log(token)

    // 3. Verify on Nomba
    const envUrl = process.env.URL
    const url = `${envUrl}/v1/checkout/transaction?idType=ORDER_REFERENCE&id=${reference}`;

    const verifyResponse = await fetch(url, {
      method: "GET",
      headers: {
        accountId: process.env.NOMBA_ACCOUNT_ID,
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await verifyResponse.json();
    console.log("NOMBA VERIFY RESPONSE:", data);

    if (data.code !== "00") {
      // Mark as failed
      transaction.status = "failed";
      await transaction.save();

      return res.status(400).json({
        status: false,
        message: "Nomba verification failed",
        data,
      });
    }

    // PAYMENT STATUS IN NOMBA
    const isPaid = data?.data?.success;
    console.log(isPaid)

    if (!isPaid) {
      // Mark as failed
      transaction.status = "failed";
      await transaction.save();

      return res.status(400).json({
        status: false,
        message: "Payment not completed",
        nombaStatus: isPaid,
      });
    }

    // 4. Payment successful → CREDIT WALLET

    const userWallet = await Wallet.findById(transaction.receiverWalletId);
    if (!userWallet) {
      return res.status(404).json({
        status: false,
        message: "Receiver wallet not found"
      });
    }

    const balanceBefore = userWallet.balance || 0;
    const amountToCredit = transaction.amount; // already saved at initialization
    const chargeAmount = transaction.charges

    const newBalance = balanceBefore + amountToCredit;

    // Update wallet
    userWallet.balance = newBalance;
    await userWallet.save();

    //update charges wallet
      topupChargesWallet.balance += chargeAmount;
      topupChargesWallet.lastTransaction = new Date();
      topupChargesWallet.lastTransactionAmount = chargeAmount;
      topupChargesWallet.lastTransactionType = 'credit';
      await topupChargesWallet.save();
    // 5. Update transaction record
    
    transaction.status = "success";
    transaction.balanceAfter = newBalance;
    transaction.gatewayResponse = data;
    transaction.updatedAt = new Date();
    await transaction.save();


    await Transaction.create({
        senderWalletId: userWallet._id,
        receiverWalletId: topupChargesWallet._id,
        transactionType: 'wallet_topup',
        category: 'credit',
        amount: chargeAmount,
        balanceBefore: topupChargesWallet.balance,
        balanceAfter: topupChargesWallet.balance + chargeAmount,
        reference: generateReference('TPCH'),
        description: 'Wallet top-up via Nomba',
        status: 'success',
        metadata: {
          initiatedBy: user._id,
          email: user.email,
          platform: 'web',
          chargeAmount: chargeAmount * 100, // Store charge in kobo
          topupAmount: amountToCredit * 100, // Store topup amount in kobo
        }

      })

    return res.status(200).json({
      status: true,
      message: "Transaction verified and wallet credited",
      transaction,
      nomba: data
    });

  } catch (error) {
    console.error("Nomba Verify Error:", error.message);

    return res.status(500).json({
      status: false,
      message: "Internal server error verifying Nomba payment",
      error: error.message,
    });
  }
}
exports.logNombaTransaction = async(req, res) => {
  try {
    const { reference } = req.params;
    const userId = req.user?.id
    const orderReference = reference
    const user = await regUser.findById(userId)
    if(!user){
      return res.status(400).json({
         status: false,
        message: "user not found"
      })
    }
    const {amount, chargeAmount } = req.body

     const transaction = await Transaction.findOne({ reference });

    if (transaction && transaction.status === 'success') {
      return res.status(404).json({
        status: false,
        message: "Transaction already processed"
      });
    }

     const topupChargesWallet = await Wallet.findOne({ walletName: 'Topup Charge Wallet' });
      if (!topupChargesWallet) {
        return res.status(404).json({ message: 'Topup Charge Wallet not found' });
      }

    // 2. Generate Nomba token
    const token = await generateNombaToken();
      // console.log(token)



    // 3. Verify on Nomba
    const envUrl = process.env.URL
    const url = `${envUrl}/v1/checkout/transaction?idType=ORDER_REFERENCE&id=${reference}`;

    const systemWallet = await Wallet.findById(process.env.SYSTEM_WALLET_ID);
    if (!systemWallet) return res.status(404).json({ message: "System wallet not found" });

    const verifyResponse = await fetch(url, {
      method: "GET",
      headers: {
        accountId: process.env.NOMBA_ACCOUNT_ID,
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await verifyResponse.json();
    // console.log("NOMBA VERIFY RESPONSE:", data);

    if (data.code !== "00") {
      // Mark as failed
     return res.status(400).json({
        status: false,
        message: "Nomba verification failed",
        data,
      });
    }

    // PAYMENT STATUS IN NOMBA
    const isPaid = data?.data?.success;
    console.log(isPaid)

    if (!isPaid) {
      // Mark as failed
      return res.status(400).json({
        status: false,
        message: "Payment not completed",
        nombaStatus: isPaid,
      });
    }
    const paidAmount = Number(data.data.order.amount);
    const originalAmount = Number(amount);

// Validate numbers first
if ([paidAmount, originalAmount, chargeAmount].some(isNaN)) {
  return res.status(400).json({
    status: false,
    message: "Invalid transaction amount values"
  });
}

const expectedTotal = originalAmount + chargeAmount;
console.log("expected",expectedTotal)
console.log("paid",paidAmount)

// Compare with 2 decimal precision (important for currency)
    if (paidAmount !== Number(expectedTotal.toFixed(2))) {
      return res.status(400).json({
        status: false,
        message: "Amount mismatch. Transaction rejected."
      });
}

    // 4. Payment successful → CREDIT WALLET

    const userWallet = await Wallet.findOne({userId});
    if (!userWallet) {
      return res.status(404).json({
        status: false,
        message: "Receiver wallet not found"
      });
    }
    console.log(userWallet)

    const balanceBefore = Number(userWallet.balance) || 0;
    const amountToCredit = Number(amount);

    if (isNaN(amountToCredit)) {
      return res.status(400).json({
        status: false,
        message: "Invalid credit amount"
      });
    }

      const newBalance = balanceBefore + amountToCredit;

      userWallet.balance = newBalance;
      await userWallet.save();


    //update charges wallet
      topupChargesWallet.balance += chargeAmount;
      topupChargesWallet.lastTransaction = new Date();
      topupChargesWallet.lastTransactionAmount = chargeAmount;
      topupChargesWallet.lastTransactionType = 'credit';
      await topupChargesWallet.save();
    // 5. Update transaction record

    // -----------------------
    // 3. SAVE TRANSACTION AS PENDING
    // -----------------------
    await Transaction.create({
      senderWalletId: systemWallet._id,
      receiverWalletId: userWallet._id,
      transactionType: "wallet_topup",
      category: "credit",
      amount,
      charges: chargeAmount,
      balanceBefore,
      balanceAfter: balanceBefore,
      reference: orderReference,
      description: "Wallet top-up via Nomba",
      status: "success",
      metadata: {
        initiatedBy: userId,
        platform: "web"
      }
    });
    
    await Transaction.create({
        senderWalletId: userWallet._id,
        receiverWalletId: topupChargesWallet._id,
        transactionType: 'wallet_topup',
        category: 'credit',
        amount: chargeAmount,
        balanceBefore: topupChargesWallet.balance,
        balanceAfter: topupChargesWallet.balance + chargeAmount,
        reference: generateReference('TPCH'),
        description: 'Wallet top-up via Nomba',
        status: 'success',
        metadata: {
          initiatedBy: user._id,
          email: user.email,
          platform: 'web',
          chargeAmount: chargeAmount * 100, // Store charge in kobo
          topupAmount: amountToCredit * 100, // Store topup amount in kobo
        }

      })
    // await transaction.save();


    // await Transaction.create({
    //     senderWalletId: userWallet._id,
    //     receiverWalletId: topupChargesWallet._id,
    //     transactionType: 'wallet_topup',
    //     category: 'credit',
    //     amount: chargeAmount,
    //     balanceBefore: topupChargesWallet.balance,
    //     balanceAfter: topupChargesWallet.balance + chargeAmount,
    //     reference: generateReference('TPCH'),
    //     description: 'Wallet top-up via Nomba',
    //     status: 'success',
    //     metadata: {
    //       initiatedBy: user._id,
    //       email: user.email,
    //       platform: 'web',
    //       chargeAmount: chargeAmount * 100, // Store charge in kobo
    //       topupAmount: amountToCredit * 100, // Store topup amount in kobo
    //     }

    //   })

    return res.status(200).json({
      status: true,
      message: "Transaction verified and wallet credited",
      transaction,
      nomba: data
    });

  } catch (error) {
    console.error("Nomba Verify Error:", error.message);

    return res.status(500).json({
      status: false,
      message: "Internal server error verifying Nomba payment",
      error: error.message,
    });
  }
}