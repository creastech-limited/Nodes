const {regUser} = require('../Models/registeration');  // Import User model
const Wallet = require('../Models/walletSchema');  // Import Wallet model
const { createPaystackAccount } = require( '../utils/paystack'); // Import the Paystack service function


// Function to delete a system wallet for admin users
async function deleteWallet(req, res) {
  const userId = req.user?.id || req.body.userId;
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  //get wallet id from request body
  const { walletId } = req.body;
  try {
    const user = await regUser.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    } 
    // Check if a system wallet exists globally
    const existing = await Wallet.findById(walletId);
    if (!existing) {
      return res.status(404).json({ message: 'System wallet not found' });
    }
    if (existing.type !== 'system') {
      return res.status(400).json({ message: 'This wallet is not a system wallet'
      });
    }
    // Delete the system wallet
    await Wallet.findByIdAndDelete(walletId);
    console.log("System wallet deleted:", walletId);
    return res.status(200).json({
      message: 'System wallet deleted successfully',
      walletId: walletId,
      user: {
        email: user.email,
        firstName: user.firstName,  
        lastName: user.lastName,
        phone: user.phone,
      }
    });
  } catch (error) {
    console.error("Error deleting system wallet:", error);
    res.status(500).json({ message: error.message });
  }
}

// Function to create a system wallet for admin users



async function createSystemWallet(req, res) {
  const  id = req.user?.id || req.body;
  if (!id) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  try {
    const data = await regUser.findById(id.toString()).select('email firstName lastName phone');
    if (!data) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if a system wallet already exists globally
    const existing = await Wallet.findOne({ type: 'system' });
    if (existing) {
      console.log("System wallet already exists:", existing._id);
      return res.status(409).json({
        message: "System wallet already exists",
        walletId: existing._id,
        walletType: existing.type,
        walletBalance: existing.balance
      });
    }

    const systemWallet = await Wallet.create({
      userId: data._id,
      currency: 'NGN',
      type: 'system',
      balance: 0,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,

    });

    console.log("System wallet created:", systemWallet._id);
    return res.status(201).json({
      message: 'System wallet created successfully',
      walletId: systemWallet._id,
      user: data
    });

  } catch (error) {
    console.error("Error creating system wallet:", error);
    res.status(500).json({ message: error.message });
  }
}

//create charges wallet for users
async function createChargesWallet(req, res) {
  const userId = req.user?.id || req.body.userId;
  console.log("Creating charges wallet for user ID:", userId);
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  const {walletName} = req.body;
  if (!walletName) {
    return res.status(400).json({ message: 'Wallet name is required' });
  } 
  try {
    const data = await regUser.findById(userId.toString()).select('email firstName lastName phone');
    if (!data) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Check if a charges wallet already exists for this user
    const existing = await Wallet.findOne({ 
      userId: data._id, 
      walletName: { $regex: `^${walletName}$`, $options: 'i' }, // Case-insensitive search});
    });
    if (existing) {
      console.log("Charges wallet already exists:", existing._id);
      return res.status(409).json({
        message: "Charges wallet already exists",
        walletId: existing._id,
        walletType: existing.type,
        walletBalance: existing.balance
      });
    }

    const chargesWallet = await Wallet.create({
      userId: data._id,
      walletName: req.body.walletName,
      currency: 'NGN',
      type: 'charges',
      balance: 0,
      email: data.email,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
    });

    console.log("Charges wallet created:", chargesWallet._id);
    return res.status(201).json({
      message: 'Charges wallet created successfully',
      walletId: chargesWallet._id,
      user: data
    });

  } catch (error) {
    console.error("Error creating charges wallet:", error);
    res.status(500).json({ message: error.message });
  }
}

//get all charges wallets
async function getChargesWallets(req, res) {
  try {
    const wallets = await Wallet.find({ type: 'charges' });
    if (wallets.length === 0) {
      return res.status(404).json({ message: 'No charges wallets found' });
    }
    res.status(200).json(wallets);
  } catch (error) {
    console.error("Error fetching charges wallets:", error);
    res.status(500).json({ message: error.message });
  }
};

//update charges wallet 
async function updateChargesWallet(req, res) {
  const { walletId } = req.params;
  const { walletName, balance, description } = req.body;

  if (!walletId) {
    return res.status(400).json({ message: 'Wallet ID, name, and balance are required' });
  }

  try {
    const updatedWallet = await Wallet.findByIdAndUpdate(walletId, {
      walletName,
      balance,
      description
    }, { new: true });

    if (!updatedWallet) {
      return res.status(404).json({ message: 'Charges wallet not found' });
    }

    res.status(200).json({
      message: 'Charges wallet updated successfully',
      wallet: updatedWallet
    });
  } catch (error) {
    console.error("Error updating charges wallet:", error);
    res.status(500).json({ message: error.message });
  }
}

// Function to initialize wallets for all users
async function initializeWalletsForUsers() {
  try {
    const users = await regUser.find();
    const userCount = users.length;
    console.log(`Total users found: ${userCount}`);

    const creationPromises = [];

    for (let user of users) {
      const existingWallet = await Wallet.findOne({ userId: user._id, type: 'user' });

      if (!existingWallet) {
        const walletData = {
          userId: user._id,
          type: 'user',
          balance: 0,
          currency: 'NGN',
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
        };

        creationPromises.push(Wallet.create(walletData));
        console.log(`✅ Wallet created for ${user.email}`);
      } else {
        console.log(`⏭️ Wallet already exists for ${user.email}`);
      }
    }

    await Promise.all(creationPromises);

    console.log('✅ Wallet initialization completed.');
  } catch (error) {
    console.error('❌ Error initializing wallet:', error.message);
  }
}
//update wallets for user by userId
async function updateWalletsForUsers() {  
  const userId = req.user?.id || req.body.userId;
  if (!userId) {
    return res.status(400).json({ message: 'User ID is required' });
  }
  try {
    const user = await regUser.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    //get the wallet name from request body
    const { walletName } = req.params;
    if (!walletName) {
      return res.status(400).json({ message: 'Wallet name is required' });
    }
    // get items to be updated from request body
    const { email, firstName, lastName, phone } = req.body;
    const wallet = await Wallet.findOne({ walletName: walletName, type: 'user' });
    if (!wallet) {
      return res.status(404).json({ message: 'Wallet not found' });
    }

    // Update wallet details
    wallet.email = user.email;
    wallet.firstName = user.firstName;
    wallet.lastName = user.lastName;
    wallet.phone = user.phone;

    await wallet.save();

    return res.status(200).json({
      message: 'Wallet updated successfully',
      wallet,
    });

  } catch (error) {
    console.error("Error updating wallet:", error);
    res.status(500).json({ message: error.message });
  }
}
exports.updatePaystackWalletsForParents = async (req, res) => {
  try {
    // Get all parent wallets
    const wallets = await Wallet.find({ type: "user" })
    .populate('userId', 'role');

    if (!wallets.length) {
      return res.status(404).json({
        message: "No user wallets found.",
      });
    }
    console.log(`Found ${wallets.length} user wallets.`);
    
    const parentWallets = wallets.filter(
      wallet => wallet.userId && wallet.userId.role === "parent"
    );
console.log(`Found ${parentWallets.length} parent wallets.`);
if (!parentWallets.length) {
  return res.status(404).json({
    message: "No parent wallets found.",
  });
}



    

    let success = 0;
    let failed = 0;
    const errors = [];

    for (const wallet of wallets) {
      try {
        // Skip wallets that already have a Paystack account
        if (wallet.paystackAccountNumber) {
          continue;
        }

        const response = await createPaystackAccount({
          firstName: wallet.firstName,
          lastName: wallet.lastName,
          email: wallet.email,
          phone: wallet.phone,
        });

        if (!response.status) {
          failed++;
          errors.push({
            walletId: wallet._id,
            email: wallet.email,
            error: response.message,
          });
          continue;
        }

        const data = response.data;
        console.log(`Paystack account created for wallet ${wallet._id}:`, data);

        // Customer
        wallet.paystackCustomerId = data.customer.id;
        wallet.paystackCustomerCode = data.customer.customer_code;

        // Dedicated Account
        wallet.paystackDedicatedAccountId = data.id;
        wallet.paystackAccountNumber = data.account_number;
        wallet.paystackAccountName = data.account_name;

        // Bank
        wallet.paystackBankId = data.bank.id;
        wallet.paystackBankName = data.bank.name;
        wallet.paystackBankSlug = data.bank.slug;

        // Status
        wallet.paystackAssigned = data.assigned;
        wallet.paystackActive = data.active;
        wallet.paystackCurrency = data.currency;
        wallet.paystackAccountType = data.assignment.account_type;

        // Assignment
        wallet.paystackAssignment = {
          integration: data.assignment.integration,
          assigneeId: data.assignment.assignee_id,
          assigneeType: data.assignment.assignee_type,
          expired: data.assignment.expired,
          assignedAt: data.assignment.assigned_at,
        };

        wallet.updatedAt = new Date();

        await wallet.save();

        success++;
      } catch (err) {
        failed++;

        errors.push({
          walletId: wallet._id,
          email: wallet.email,
          error: err.message,
        });
      }
    }

    return res.status(200).json({
      message: "Paystack wallet update completed.",
      totalWallets: wallets.length,
      successful: success,
      failed,
      skipped: wallets.length - success - failed,
      errors,
    });

  } catch (error) {
    console.error("Error updating Paystack wallets:", error);

    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
};

//Update Paystack dedicated accounts for a specific user by userId
async function updatePaystackDedicatedAccountForUser(req, res) {
  const userId = req.user?.id || req.body.userId;

  if (!userId) {
    return res.status(400).json({
      message: "User ID is required",
    });
  }

  try {
    const user = await regUser.findById(userId);

    if (!user) {
      return res.status(404).json({
        message: "User not found",
      });
    }

    const wallet = await Wallet.findOne({
      userId: user._id,
      type: "user",
    });

    if (!wallet) {
      return res.status(404).json({
        message: "Wallet not found",
      });
    }

    // Already assigned?
    if (wallet.paystackDedicatedAccountId) {
      return res.status(409).json({
        message: "Dedicated account already exists",
        data: {
          accountNumber: wallet.paystackAccountNumber,
          accountName: wallet.paystackAccountName,
          bankName: wallet.paystackBankName,
        },
      });
    }

    const response = await createPaystackAccount({
      firstName: wallet.firstName,
      lastName: wallet.lastName,
      email: wallet.email,
      phone: wallet.phone,
    });

    if (!response.status) {
      return res.status(400).json({
        message: response.message,
      });
    }
    console.log("Paystack account created for user:", response.data);

    // Copy every returned field onto the wallet
    Object.assign(wallet, response.data);

    await wallet.save();

    return res.status(200).json({
      message: "Paystack dedicated account created successfully",
      data: wallet,
    });

  } catch (error) {
    console.error("Paystack Error:", error);

    return res.status(500).json({
      message: "Internal Server Error",
      error: error.message,
    });
  }
}

module.exports = {
  createSystemWallet,
  initializeWalletsForUsers,
  createChargesWallet,
  deleteWallet,
  getChargesWallets,
  updateChargesWallet,
  updatePaystackDedicatedAccountForUser,
};