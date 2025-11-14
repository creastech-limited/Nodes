const express = require('express');
const axios = require('axios');
const Model = require('../Models/models'); // Corrected import statement
// const RegisterModel = require('../Models/registeration'); // Corrected import statement
// const LoginModel = require('../Models/login'); // Corrected import statement
const router = express.Router();
const bcrypt = require('bcrypt');
const {regUser} = require('../Models/registeration');
const disputeData = require('../Models/dispute');
const {createDispute} = require('../Controllers/dispute');
const {getallUsers, getuserbyid} = require('../Controllers/getAllusers');
const { initiateTransaction, verifyTransaction} = require('../Controllers/transactionController');
const jwt = require('jsonwebtoken');
const {initializeWalletsForUsers} = require('../Controllers/initiateWalletController');
const verifyToken = require('../routes/verifyToken');
const {getAllTransactions} = require('../Controllers/transactionController');
const sendEmail = require('../utils/email');





//get all transactions
// router.get('/getAllTransactions',verifyToken, getAllTransactions);
// //initiate transaction
// router.post('/initiateTransaction',verifyToken, initiateTransaction);
// //verify transaction
// router.get('/verifyTransaction/:reference',verifyToken, verifyTransaction);
//generate Wallet Address for Users without a wallet address
router.post('/createWallet',verifyToken, initializeWalletsForUsers)

// This route is used to activate a user account by updating the status to 'Active'
router.get('/activate/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const user = await regUser.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        user.status = 'Inactive'; // Set status to 'Active'
        await user.save();
        res.status(200).json({ message: 'User activated successfully', });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

router.get('/activated/:id', async (req, res) => {
  try {
    const { id } = req.params;
    // console.log(id)
    const user = await regUser.findByIdAndUpdate(id, { status: 'Active' }, { new: true });
    console.log(user.status)
    if (!user) {
      return res.status(404).send('Activation failed: user not found.');
    }
     //send a suucess email to the user
    await sendEmail(
      user.email,
      'Account Activation Successful',
      `<p>Hello ${user.firstName},</p>
        <p>Your account has been successfully activated. You can now log in to your account.<br/> <a href='${process.env.NGROK_URL}' target='_blank'>Login Now!</a></p>
        <p>Thank you for using our service!</p>`
    );
    
    // Redirect to login page
    res.redirect(process.env.FRONTEND_URL_PROD); // Replace with your actual frontend login URL
    // Optionally, you can send a success message
    // res.status(200).send('User activated successfully. You can now log in.');
   
  } catch (err) {
    res.status(500).send('Server error during activation.');
  }
});




//Create a new dispute
// router.post('/createDispute', createDispute);


//Get all data from the database
// router.get('/getAllUsers', getallUsers);

// Get data by ID from the database
router.get('/getById/:id', getuserbyid);

//Put API
router.put('/put', (req, res) => {
    res.send('Updating Data by ID');
});
//Patch API
router.patch('/patch/:id', async (req, res) => {
    try{
        const id = req.params.id;
        const datatoUpdate = req.body;
        const options = { new: true };
        const result = await regUser.findByIdAndUpdate(id, datatoUpdate, options);

        res.send(result);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
        
    }
});
//Activate API

//Deactivate API

//Patch API

//delete API

//Post data to the database
router.post('/post', async(req, res) => {
    const data = new Model(
        {
            name: req.body.name,
            age: req.body.age
        }
    );
    try {
       const dataToSave = await data.save()
        res.status(200).json(dataToSave);
    }
    catch (error) {
        res.status(400).json({ message: error.message });
    }   
});

//Register API
// router.post('/register', async (req, res) => {
//     const { name, email, phone, role, password, confirmPassword } = req.body;
//     const user = new RegisterModel({ name, email, phone, role, password, confirmPassword });
//     try {
//         const savedUser = await user.save();
//         res.status(200).json(savedUser);
//     } catch (error) {
//         res.status(400).json({ message: error.message });
//     }
// });
// Register API
// router.post('/register', async (req, res) => {
//     const { firstName, lastName,schoolName,storeName,storeType,schoolId, schoolAddress, email, phone, role, password, confirmPassword } = req.body;

//     // Check password match
//     // if (password !== confirmPassword) {
//     //     return res.status(400).json({ message: 'Passwords do not match' });
//     // }

//     try {
//         // Hash password
//         const salt = await bcrypt.genSalt(10);
//         const hashedPassword = await bcrypt.hash(password, salt);

//         const user = new regUser({
//             firstName,
//             lastName,
//             schoolName,
//             schoolAddress,
//             storeName,
//             storeType,
//             email,
//             phone,
//             role,
//             password: hashedPassword,
            
//         });

//         const savedUser = await user.save();
//         res.status(201).json(savedUser);

//     } catch (error) {
//         res.status(400).json({ message: error.message });
//     }
// });






// Simple login route without JWT


  //second login route
  router.post('/login2', async (req, res) => {
    const { email, password } = req.body;
  
    try {
      // 1. Check if user exists
      const user = await regUser.findOne({ email: email.toLowerCase().trim() });
      if (!user) return res.status(404).json({ message: 'User not found' });
  
      // 2. Compare passwords
      const isMatch = await bcrypt.compare(password, user.password);
      console.log('User found:', user.email);
        console.log('Password match:', await bcrypt.compare(password, user.password));

      if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });
  
      // 3. Return success (no JWT/token)
      res.status(200).json({
        message: 'Login successful',
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          schoolName: user.schoolName,
          schoolAddress: user.schoolAddress,
          storeName: user.storeName,
          storeType: user.storeType,
          schoolId: user.schoolId
        }
      });
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  //Get All User with a particular School ID
  router.get('/user/school/:schoolId', async (req, res) => {
    const { schoolId } = req.params;
  
    try {
      const user = await User.findOne({ schoolId });
  
      if (!user) {
        return res.status(404).json({ message: 'User not found with this school ID' });
      }
  
      res.status(200).json({
        message: 'User fetched successfully by schoolId',
        user: {
          id: user._id,
          email: user.email,
          role: user.role,
          firstName: user.firstName,
          lastName: user.lastName,
          phone: user.phone,
          schoolName: user.schoolName,
          schoolAddress: user.schoolAddress,
          storeName: user.storeName,
          storeType: user.storeType,
          schoolId: user.schoolId
        }
      });
    } catch (err) {
      res.status(500).json({ message: 'Error fetching user', error: err.message });
    }
  });
  //Get Users by role

  router.get('/user/role/:role', async (req, res) => {
    const { role } = req.params;
  
    try {
      // Find users by role
      const users = await regUser.find({ role });
  
      if (!users || users.length === 0) {
        return res.status(404).json({ message: `No ${role} found` });
      }
  
      const formattedUsers = users.map(user => {
        let roleSpecificId = {};
  
        const userRole = user.role.toLowerCase();
        if (userRole === 'student') {
          roleSpecificId.student_id = `${user.schoolId}/${user._id}`;
        } else if (userRole === 'agent') {
          roleSpecificId.agent_id = `${user.store_id}/${user._id}`;
        } else if (userRole === 'store') {
          roleSpecificId.store_id = `${user.schoolId}/${user._id}`;
        }
  
        return {
          user
        };
      });
  
      res.status(200).json({
        message: `${users.length} user(s) found with the role: ${role}`,
        users: formattedUsers
      });
    } catch (err) {
      res.status(500).json({ message: 'Error fetching users', error: err.message });
    }
  });
  
  
  router.get('/user/status/:status', async (req, res) => {
    try {
      // Correctly extract the status from request parameters
      const { status } = req.params;
  
      // Find users with the given status
      const users = await regUser.find({ status });
  
      if (!users || users.length === 0) {
        return res.status(404).json({ message: `No ${status} user found` });
      }
  
      res.status(200).json({
    
      });
    } catch (err) {
      res.status(500).json({ message: 'Error fetching users', error: err.message });
    }
  });
  
// Dele all users by role
// DELETE users with a specific role
router.delete('/delete-role/:role', async (req, res) => {
  const { role } = req.params; // Get the role from the URL parameter
  
  try {
    const result = await regUser.deleteMany({ role: role }); // Delete users with the specific role
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: `No users found with the role: ${role}` });
    }
    res.status(200).json({ message: `${result.deletedCount} users with the role ${role} deleted successfully` });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting users', error });
  }
});

module.exports = router