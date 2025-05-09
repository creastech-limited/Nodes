const axios = require('axios');

const Transaction = require('../Models/transactionSchema'); // Import Transaction model
const User = require('../Models/registeration'); // Import User model
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
exports.getTransactionById = async (req, res) => {
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

    // Find transactions where the user's wallet is either sender or receiver
    const transactions = await Transaction.find({
      $or: [
        { senderWalletId: wallet._id },
        { receiverWalletId: wallet._id }
      ]
    })
      .populate('senderWalletId')
      .populate('receiverWalletId')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      message: `Found ${transactions.length} transaction(s) for user`,
      data: transactions
    });
  } catch (error) {
    console.error('Error fetching transactions by token ID:', error.message);
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
    const userEmail = await User.findById(userId).select('email').then(user => user.email);

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
        callback_url: 'http://localhost:3000/payment/callback', // Change to real callback
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

      const user = await User.findOne({ email: userEmail });
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
