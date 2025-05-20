const axios = require('axios');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');
const Transaction = require('../Models/transactionSchema'); // Import Transaction model
const {regUser} = require('../Models/registeration'); // Import User model
const Wallet = require('../Models/walletSchema'); // Import Wallet model
// const verifyToken = require('../routes/verifyToken'); // Import verifyToken middleware

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

//     // Log each transaction and determine if the user was sender or receiver
//     transactions.forEach((tx) => {
//       const isSender = tx.senderWalletId._id.toString() === wallet._id.toString();
//       const isReceiver = tx.receiverWalletId._id.toString() === wallet._id.toString();
//       const direction = isSender ? 'Sent' : isReceiver ? 'Received' : 'Unknown';

//       console.log(`Transaction ID: ${tx._id}`);
//       console.log(`  Amount: ${tx.amount}`);
//       console.log(`  Type: ${direction}`);
//       console.log(`  From: ${tx.senderWalletId?.userId}`);
//       console.log(`  To: ${tx.receiverWalletId?.userId}`);
//       console.log(`  Date: ${tx.createdAt}`);
//       console.log('---');
//     });

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
    const userEmail = req.user?.email;
    console.log(userEmail)

    if (!userEmail) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: Missing user email'
      });
    }

    // Find transactions where any email field in metadata matches user email
    const transactions = await Transaction.find({
      $or: [
        { 'metadata.senderEmail': userEmail },
        { 'metadata.receiverEmail': userEmail },
        { 'metadata.email': userEmail }
      ]
    })
      .populate('senderWalletId')
      .populate('receiverWalletId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: `Found ${transactions.length} transaction(s) for user email`,
      data: transactions
    });
  } catch (error) {
    console.error('Error fetching transactions by user email in metadata:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching transactions'
    });
  }
};

//get transaction for a particular school which includes all students in the school
exports.getRecentTransactionsByToken = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No user ID in token'
      });
    }

    // Find the user's wallet
    const wallet = await Wallet.findOne({ userId });
    if (!wallet) {
      return res.status(404).json({
        success: false,
        message: 'Wallet not found for the authenticated user'
      });
    }

    // Find latest 5 transactions
    const transactions = await Transaction.find({
      $or: [
        { senderWalletId: wallet._id },
        { receiverWalletId: wallet._id }
      ]
    })
      .populate('senderWalletId')
      .populate('receiverWalletId')
      .sort({ createdAt: -1 })
      .limit(5); // Only the 5 most recent

    res.status(200).json({
      success: true,
      message: `Found ${transactions.length} recent transaction(s)`,
      data: transactions
    });
  } catch (error) {
    console.error('Error fetching recent transactions:', error.message);
    res.status(500).json({
      success: false,
      message: 'Server error while fetching recent transactions'
    });
  }
};






exports.initiateTransaction = async (req, res) => {
  const paystackSecretKey = process.env.PAYSTACK_SECRET_KEY;

  try {
    const { amount } = req.body;

    const userId = req.user?.id;
    console.log("User ID:", userId);
    const systemWalletId = "6807b1ab7e897e850550121d"; // Get system wallet ID from request body
    const userEmail = await regUser.findById(userId).select('email').then(user => user.email);

    console.log("User Email:", userEmail);

    if (!userId || !userEmail) {
      return res.status(401).json({ message: 'Unauthorized: user info not available' });
    }

    if (!amount || isNaN(amount) || amount <= 0) {
      return res.status(400).json({ message: 'Valid amount is required' });
    }
    //fetch system wallet
    const systemWallet = await Wallet.findById(systemWalletId);
    if (!systemWallet) {
      return res.status(404).json({ message: 'System wallet not found' });
    }
    // Fetch user's wallet
    const userWallet = await Wallet.findOne({ userId });
    if (!userWallet) {
      return res.status(404).json({ message: 'Wallet not found for this user' });
    }

    const balanceBefore = userWallet.balance || 0;

    // Call Paystack to initialize transaction
    const response = await axios.post(
      'https://api.paystack.co/transaction/initialize',
      {
        amount: amount * 100,
        email: userEmail,
        callback_url: 'http://localhost:5174/payment/callback', // Change to real callback
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


exports.verifyTransaction = async (req, res) => {
  try {
    const reference = req.query.reference || req.params.reference;
    console.log("Reference:", reference);
    console.log(process.env.PAYSTACK_SECRET_KEY);
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
  console.log("User Wallet not found for userId:", user._id.toString());
  console.log("typeof user._id:", typeof user._id);
console.log("user._id constructor:", user._id.constructor.name);
console.log("user._id value:", user._id.valueOf());
  return res.status(404).json({ status: false, message: 'Wallet not found' });
}


      const amount = data.amount / 100;
      const balanceBefore = userWallet.balance;
      const balanceAfter = balanceBefore + amount;
      console.log("Balance Before:", balanceBefore);
      console.log("Balance After:", balanceAfter);
      // 🟡 Find the existing pending transaction by reference
      console.log("Reference:", reference);
      const existingTxn = await Transaction.findOne({ reference, status: 'pending' });
      if (!existingTxn) {
        return res.status(404).json({ status: false, message: 'Pending transaction not found' });
      }

      // ✅ Update wallet balance
      userWallet.balance = balanceAfter;
      await userWallet.save();

      // ✅ Update the transaction record
      existingTxn.status = 'success';
      existingTxn.balanceAfter = balanceAfter;
      existingTxn.updatedAt = new Date();
      existingTxn.senderWalletId = userWallet._id;
      existingTxn.receiverWalletId = userWallet._id;
      await existingTxn.save();

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

exports.getAllSchoolTransactions = async (req, res) => {
  try {
    const schoolId = req.user?.schoolId;

    if (!schoolId) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized: No school ID found in token'
      });
    }

    // Find all students under the school
    const students = await User.find({ role: 'student', schoolId }, '_id');

    if (students.length === 0) {
      return res.status(200).json({
        success: true,
        message: 'No students found for this school',
        data: []
      });
    }

    const studentIds = students.map(student => student._id);

    // Get all wallets for those students
    const wallets = await Wallet.find({ userId: { $in: studentIds } }, '_id');
    const walletIds = wallets.map(wallet => wallet._id);

    // Find transactions where sender or receiver is among those wallets
    const transactions = await Transaction.find({
      $or: [
        { senderWalletId: { $in: walletIds } },
        { receiverWalletId: { $in: walletIds } }
      ]
    })
      .populate('senderWalletId')
      .populate('receiverWalletId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: `${transactions.length} transaction(s) found for school`,
      data: transactions
    });
  } catch (error) {
    console.error('Error fetching school transactions:', error.message);
    res.status(500).json({
      success: false,
      message: 'Error fetching transactions for school'
    });
  }
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
      return res.status(404).json({ error: 'Receiver not found' });
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
        receiverEmail: receiver.email
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
        senderEmail: sender.email
      }
    });

    await senderTransaction.save();
    await receiverTransaction.save();

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
