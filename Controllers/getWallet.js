const Wallet = require('../Models/walletSchema'); // Import Wallet model
const User = require('../Models/registeration'); // Import User model


exports.getOneWallet = async (req, res) => {
  try {
    const { id, userId, balance, currency, type } = req.query;

    // Build query object dynamically
    let query = {};

    if (id) query._id = id;
    if (userId) query.userId = userId;
    if (balance) query.balance = Number(balance);
    if (currency) query.currency = currency;
    if (type) query.type = type;

    console.log("Query object:", query); // Log the query object for debugging
    const wallets = await Wallet.find(query);
    res.status(200).json({ status: true, data: wallets });
  } catch (error) {
    console.error("Error fetching wallets:", error);
    res.status(500).json({ status: false, message: 'Server error fetching wallets' });
  }
};
  


  exports.getWallet = async (req, res) => {
    try {
      const wallets = await Wallet.find().populate('userId', 'email firstName lastName'); // Populate user details
      return res.status(200).json(wallets);
    } catch (err) {
      return res.status(500).json({ message: 'Error fetching wallets' });
    }
  }

  exports.deleteWallet = async (req, res) => {
    try {
      const { walletId } = req.params;
  
      const deletedWallet = await Wallet.findByIdAndDelete(walletId);
  
      if (!deletedWallet) {
        return res.status(404).json({ status: false, message: 'Wallet not found' });
      }
  
      return res.status(200).json({
        status: true,
        message: 'Wallet deleted successfully',
        wallet: deletedWallet,
      });
    } catch (error) {
      console.error('Error deleting wallet:', error.message);
      return res.status(500).json({ status: false, message: 'Server error' });
    }
  };
  

  //delete by filter
  exports.deleteWalletsByFilter = async (req, res) => {
    try {
      const filters = req.body; // Use request body for dynamic filters
  
      // Validate filters
      if (Object.keys(filters).length === 0) {
        return res.status(400).json({
          status: false,
          message: 'At least one filter parameter must be provided.',
        });
      }
  
      const result = await Wallet.deleteMany(filters);
  
      return res.status(200).json({
        status: true,
        message: 'Wallets deleted successfully based on provided filters',
        deletedCount: result.deletedCount,
      });
    } catch (error) {
      console.error('Error deleting wallets by filter:', error.message);
      return res.status(500).json({ status: false, message: 'Server error' });
    }
  };
  
  exports.getUserWallet = async (req, res) => {
    try {
      const userId = req.user?.id; // comes from the token (auth middleware)
  
      const wallet = await Wallet.findOne({ userId });
  
      if (!wallet) {
        return res.status(404).json({ status: false, message: 'Wallet not found' });
      }
  
      res.status(200).json({ status: true, data: wallet });
    } catch (error) {
      console.error("Error fetching wallet:", error.message);
      res.status(500).json({ status: false, message: 'Server error fetching wallet' });
    }
  };
  