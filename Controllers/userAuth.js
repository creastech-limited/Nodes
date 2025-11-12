const QRCode = require('qrcode');
const {TransactionLimit} = require('../Models/transactionSchema');
const {regUser, ClassUser, Beneficiary} = require('../Models/registeration');
const Charge = require('../Models/charges');
const bcrypt = require('bcryptjs');
const sendEmail = require('../utils/email');
const FeeStatus = require('../Models/fees');
const {Fee, FeePayment} = require('../Models/fees');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const XLSX = require('xlsx');
const Wallet = require('../Models/walletSchema'); // Import Wallet model
const { createUserFromPayload } = require('./registerHelpers');


//function to proper case
function toProperCase(str) {
  if (typeof str !== "string") {
    return ""; // or null if you prefer
  }

  if (str.trim() === "") {
    return "";
  }

  return str
    .toLowerCase()
    .split(" ")
    .filter(word => word.trim() !== "")
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}



function generateTokens(user) {
  const accessToken = jwt.sign(
    {
      id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    },
    process.env.JWT_SECRET_KEY,
    { expiresIn: '40m' } // short-lived access token
  );

  const refreshToken = jwt.sign(
    { id: user._id },
    process.env.JWT_REFRESH_SECRET_KEY,
    { expiresIn: '30d' } // long-lived refresh token
  );

  return { accessToken, refreshToken };
}
//get children by guardian email
exports.getStudentsByBeneficiaryEmail = async (req, res) => {
  try {
    const userId = req.user?.id; // User making the request
    const currentUser = await regUser.findById(userId); //
    if (!currentUser) {

        return res.status(401).json({ message: "Unauthorized" });
    }
    if (currentUser.role.toLowerCase() !== 'parent') {
        return res.status(403).json({ message: "Forbidden: You are not authorized to view students" });
    }
    const email = currentUser.email;
    const myChild = await regUser.find({  
      "guardian.email": email,
      role: "student"
      }).select("firstName lastName name email phone student_id schoolId");
    if (myChild.length === 0) {
        return res.status(404).json({ message: "No students found with this email" });
    }
    res.status(200).json({ myChild });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
//get parent user by student id
exports.getParent = async (req, res) => {
  try {
    const userId = req.user?.id; // User making the request
    const currentUser = await regUser.findById(userId); // Fetch current user details
    if (!currentUser) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    //current user has to be a school
    if (currentUser.role.toLowerCase() !== 'school' && currentUser.role.toLowerCase() !== 'student') {
        return res.status(403).json({ message: "Forbidden: You are not authorized to view parent details" });
    }
    const parent = await regUser.find({ role: 'parent' }).select('firstName lastName name email phone address'); //only get firstName, lastName, email, phone
    // console.log(parent);
    if (!parent) {
        return res.status(404).json({ message: "Parent not found" });
    }
    res.status(200).json({ 
      message: "Parent details fetched successfully",
      parentCount: parent.length,
      parent
     });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

//add beneficiary
exports.addBeneficiary = async (req, res) => {
  try {
    const userId = req.user?.id; // User making the request
    const currentUser = await regUser.findById(userId); // Fetch current user details
    if (!currentUser) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    if (currentUser.role.toLowerCase() !== 'parent') {
        return res.status(403).json({ message: "Forbidden: You are not authorized to add beneficiary" });
    }
    const kidId = req.params.id;
    const kid = await regUser.findById(kidId);
    if (!kid || kid.role.toLowerCase() !== 'student') {
        return res.status(404).json({ message: "Student not found" });
    }
    // Check if beneficiary with same email already exists for this user
    const existingBeneficiary = await Beneficiary.findOne({ userId: currentUser._id, email:kid.email, phone:kid.phone });
    if (existingBeneficiary) {
        return res.status(400).json({ message: "Beneficiary with this email already exists" });
    }
    const newBeneficiary = new Beneficiary({
        userId: currentUser._id,
        firstName: kid.firstName,
        lastName: kid.lastName,
        name: kid.name,
        email: kid.email,
        phone: kid.phone,
    });
    await newBeneficiary.save();
    res.status(201).json({ message: "Beneficiary added successfully", beneficiary: newBeneficiary });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

//remove beneficiary
exports.removeBeneficiary = async (req, res) => {
  try {
    const userId = req.user?.id; // User making the request
    const currentUser = await regUser.findById(userId); //
    if (!currentUser) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    if (currentUser.role.toLowerCase() !== 'parent') {
        return res.status(403).json({ message: "Forbidden: You are not authorized to remove beneficiary" });
    }
    const beneficiaryId = req.params.id;

    const beneficiary = await regUser.findById(beneficiaryId);
    if (!beneficiary) {
        return res.status(404).json({ message: "Beneficiary not found" });
    }
    // if (benefactor.userId.toString() !== currentUser._id.toString()) {
    //     return res.status(403).json({ message: "Forbidden: You can only remove your own beneficiaries" });
    // }
    await Beneficiary.findOneAndDelete({email: beneficiary.email});
    res.status(200).json({ message: "Beneficiary removed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// get beneficiaries by id
exports.getBeneficiaries = async (req, res) => {
  try {
    const userId = req.user?.id; // User making the request
    const currentUser = await regUser.findById(userId); //
    if (!currentUser) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    if (currentUser.role.toLowerCase() !== 'parent') {
        return res.status(403).json({ message: "Forbidden: You are not authorized to view beneficiaries" });
    }
    const beneficiaries = await Beneficiary.find({ userId: currentUser._id });
    res.status(200).json({
      beneficiariesCount: beneficiaries.length,
       beneficiaries 
      });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}
//update guardian for student
exports.updateGuardian = async (req, res) => {
  try {
    const userId = req.user?.id; // User making the request
    const currentUser = await regUser.findById(userId); // Fetch current user details
    if (!currentUser) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    if (currentUser.role.toLowerCase() !== 'school' && currentUser.role.toLowerCase() !== 'student') {
        return res.status(403).json({ message: "Forbidden: You are not authorized to update guardian" });
    }
    const { guardianEmail, kidEmail } = req.body;
    console.log(kidEmail);
    console.log(guardianEmail);
    const kid = await regUser.findOne({email: kidEmail, role: 'student' });
    if (!kid || kid.role.toLowerCase() !== 'student') { 
        return res.status(404).json({ message: "Student not found" });
    }
    //update TransactionLimit with guardian id
    const limit = await TransactionLimit.findOne({ studentId: kid._id });
    if (limit) {
      const guardianUser = await regUser.findOne({email: guardianEmail, role: 'parent' });
      if (!guardianUser || guardianUser.role.toLowerCase() !== 'parent') {
          return res.status(404).json({ message: "No parent found for guardian email" });
      }
      limit.parentId = guardianUser._id;
      await limit.save();
    }
    
    //find user where role is parent
    const parents = await regUser.findOne({email: guardianEmail, role: 'parent' });
    if (!parents || parents.role.toLowerCase() !== 'parent') {
        return res.status(404).json({ message: "No parents found" });
    }
    //add guardian details to student
    kid.guardian = {
      fullName: parents.name,
      relationship: 'Parent',
      email: parents.email,
      phone: parents.phone,
      address: toProperCase(parents.address) || ''
    };
    await kid.save();

    res.status(200).json({ message: "Guardian updated successfully", guardian: kid.guardian });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

//get all students whose email matches guardian email
exports.getStudentsByBeneficiaryEmail = async (req, res) => {
  try {
    const userId = req.user?.id; // User making the request
    const currentUser = await regUser.findById(userId); // Fetch current user details
    if (!currentUser) {
        return res.status(401).json({ message: "Unauthorized" });
    }
    if (currentUser.role.toLowerCase() !== 'parent') {
        return res.status(403).json({ message: "Forbidden: You are not authorized to view students" });
    }
    const email = currentUser.email;
    const myChild = await regUser.find({
      "guardian.email": email,
      role: "student"
      }).select("firstName lastName name email phone student_id schoolId");

    if (myChild.length === 0) {
        return res.status(404).json({ message: "No students found with this email" });
    }
    res.status(200).json({ myChild });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
}

// User Login
exports.login = async (req, res) => {

  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Check if user exists
    const user = await regUser.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Check if user has a password
    if (!user.password) {
      return res.status(500).json({ message: 'User has no password set' });
    }
    
    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    // console.log("Password match:", isMatch);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    // Check status
    if (user.status !== 'Active') {
      return res.status(403).json({ message: 'User is not active' });
    }

    // Create Token
    // const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY);


    const { accessToken, refreshToken } = generateTokens(user);
    //check if isFirstLogin
    // if (user.isPinSet === false) {
    //   return res.status(403).json({ message: 'User is required to set a PIN', AcessToken: accessToken });
    // }
    // change isFirstLogin to false
    user.isFirstLogin = false;
    await user.save();

    // Save refresh token in the database (optional)
    await regUser.findByIdAndUpdate(user._id, { refreshToken }, { new: true });
    // console.log("Refresh token saved in DB:", refreshToken);

    // Set refresh token in HTTP-only cookie
    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production', // true in production
      sameSite: 'Strict',
      maxAge: 30 * 24 * 60 * 60 * 1000 // 30 days
    });
   try {
  // const emailResponse = await sendEmail({
  //   to: user.email,
  //   subject: 'Login Notification',
  //   html: `<p>Hello ${user.firstName},</p><p>You have successfully logged in to your account.</p><p>Best regards,<br>Your Company Name</p>`
  // });

  // console.log("Email sent successfully:");
} catch (error) {
  console.error("Failed to send login email:", error.message);
}
    //    const emailDetails = {
    //   to: process.env.EMAIL_TO,
    //   from: {
    //     email: "davidt@yungmindsinnovative.com.ng",
    //     name: 'Your Company Name'
    //   },
    //   subject: 'Login Notification',
    //   text: `Hello ${user.firstName},\n\nYou have successfully logged in to your account.\n\nBest regards,\nYour Company Name`,
    //   html: `<p>Hello ${user.firstName},</p><p>You have successfully logged in to your account.</p><p>Best regards,<br>Your Company Name</p>`
    // };
    // sgMail.send(emailDetails)
    //   .then(() => {
    //     console.log('Login email sent successfully to', user.email);
        
    //   })
      // .catch((error) => {
      //   console.error('Failed to send login email:', error.response?.body || error.message);
      //   return res.status(500).json({
      //     message: 'Failed to send login email',
      //   }); 
      // });
    // console.log("Access token generated:", accessToken);
    // console.log("User details:", {
    //   id: user._id,});
    // Send response
   return res.status(200).json({
      message: 'Registeration successful',
      accessToken,
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
        schoolId: user.schoolId,
        boarding: user.boarding,
        dateOfBirth: user.dateOfBirth,
        profilePicture: user.profilePicture,
        phone: user.phone,
        guardian: user.guardian,
        academicDetails: user.academicDetails,
        classAdmittedTo: user.classAdmittedTo,
        schoolRegistrationLink: user.schoolRegistrationLink,
        country: user.country,
        ownership: user.ownership,
        agentName: user.agentName,
        store_id: user.store_id,
      }
    });
    //login email
   




    // Send Login Email
   

    

  } catch (err) {
    console.error('Login error:', err.message);
    return res.status(500).json({ message: err.message });
  }
}


//   exports.register = async (req, res) => {
    
//     const {
//       firstName,
//       lastName,
//       name = firstName + ' ' + lastName,
//       gender,
//       dateOfBirth,
//       country,
//       boarding,
//       email,
//       phone,
//       password,
//       profilePicture,
//       storeName,
//       accountNumber,
//       address,
//       guardian,
//       ownership = req.query.ownership ||'',
//       storeType,
//       store_id = req.query.store_id ||'',
//       student_id,
//       agentName,
//       classAdmittedTo,
//       academicDetails,
//       agent_id,
//       schoolRegistrationLink,
//       role,
//       schoolName = req.query.schoolName ||'',
//       schoolType = req.query.schoolType ||'',
//       schoolAddress = req.query.schoolAddress ||'',
//       schoolId =req.query.schoolId ||'',
//       refreshToken,
//       status = 'Inactive'
//     } = req.body;
  
//     try {
//       const address = {
//         street: req.body.street,
//         city: req.body.city,
//         state: req.body.state,
//         zipCode: req.body.zipCode
//       };
  
//       const guardian = {
//         fullName: req.body.guardianFullName,
//         relationship: req.body.guardianRelationship,
//         email: req.body.guardianEmail,
//         phone: req.body.guardianPhone,
//         occupation: req.body.guardianOccupation,
//         address: req.body.guardianAddress
//       };
  
//       const academicDetails = {
//         classAdmittedTo: req.body.classAdmittedTo,
//         section: req.body.section,
//         previousSchool: req.body.previousSchool,
//         admissionDate: req.body.admissionDate,
//         boarding: req.body.boarding
//       };
//       // Check if email already exists
//       const existingUser = await regUser.findOne({ email: email.toLowerCase().trim() });
//       if (existingUser) {
//         return res.status(400).json({ message: 'Email already in use' });
//       }
  
//       // Helper to generate 10-digit account number starting with 9
//   const generateAccountNumber =  Math.floor(9000000000 + Math.random() * 1000000000).toString();
//   // Generate unique schoolId for 'school' role if not provided
//       let generatedSchoolId = schoolId;
//       if (role.toLowerCase() === 'school' && !schoolId) {
//         const name = schoolName.toUpperCase().replace(/[^A-Z]/g, '');
//         const firstLetter = name[0] || 'X';
//         const secondLetter = name[1] || 'Y';
//         const thirdLetter = name[2] || 'Z';
//         const letters = `${firstLetter}${secondLetter}${thirdLetter}`;
//         const numbers = Math.floor(100000 + Math.random() * 900000).toString(); // always 6 digits
//         generatedSchoolId = `${letters}${numbers}`;
//       }
  
//   // Inline account number generation
//       let accountNumber;
//       let isUnique = false;
  
//       while (!isUnique) {
//           accountNumber = generateAccountNumber;
//           const exists = await regUser.findOne({ accountNumber });
//           if (!exists) {
//             isUnique = true;
//           }
//         }
//   console.log(accountNumber)
//       // Hash password
//       const salt = await bcrypt.genSalt(10);
//       const hashedPassword = await bcrypt.hash(password, salt);

//       // Role-based ID generation
//       // let roleSpecificId = {};
//       // let dynamicSchoolLink = '';
  
//   //   switch (role.toLowerCase()) {
//   //   case 'student':
//   //     roleSpecificId = { student_id: `${newUser.schoolId}/${newUser._id}` };
//   //     break;
//   //   case 'agent':
//   //     roleSpecificId = { agent_id: `${newUser.store_id}/${newUser._id}` };
//   //     break;
//   //   case 'store':
//   //     roleSpecificId = { store_id: `${newUser.schoolId}/${newUser._id}` };
//   //     dynamicSchoolLink = `/?store_id=${encodeURIComponent(newUser.store_id)}&storeName=${encodeURIComponent(newUser.storeName)}&storeType=${encodeURIComponent(newUser.storeType)}`;
//   //     break;
//   //   case 'school':
//   //     roleSpecificId = { schoolId: newUser.schoolId };
//   //     dynamicSchoolLink = `/?schoolId=${encodeURIComponent(newUser.schoolId)}&schoolName=${encodeURIComponent(newUser.schoolName)}&schoolAddress=${encodeURIComponent(newUser.schoolAddress)}&schoolType=${encodeURIComponent(newUser.schoolType)}&ownership=${encodeURIComponent(newUser.ownership)}`;
//   //     break;
//   // }
//   let roleSpecificId = {};
// let dynamicSchoolLink = '';

// switch (role.toLowerCase()) {
//   case 'student':
//     roleSpecificId = { student_id: `${generatedSchoolId}/${'TEMP_ID'}` }; // Use a temp placeholder, can update after save
//     break;
//   case 'agent':
//     roleSpecificId = { agent_id: `${store_id}/${'TEMP_ID'}` };
//     break;
//   case 'store':
//     roleSpecificId = { store_id: `${generatedSchoolId}/${'TEMP_ID'}` };
//     dynamicSchoolLink = `/?store_id=${encodeURIComponent(store_id)}&storeName=${encodeURIComponent(storeName)}&storeType=${encodeURIComponent(storeType)}`;
//     break;
//   case 'school':
//     roleSpecificId = { schoolId: generatedSchoolId };
//     dynamicSchoolLink = `/?schoolId=${encodeURIComponent(generatedSchoolId)}&schoolName=${encodeURIComponent(schoolName)}&schoolAddress=${encodeURIComponent(schoolAddress)}&schoolType=${encodeURIComponent(schoolType)}&ownership=${encodeURIComponent(ownership)}`;
//     break;
// }
  
//       // Create user
//       const newUser = new regUser({
//         firstName,
//         lastName,
//         name,
//         gender,
//         dateOfBirth,
//         profilePicture,
//         address,
//         guardian,
//         academicDetails,
//         country,
//         academicDetails,
//         classAdmittedTo,
//         schoolName,
//         schoolAddress,
//         schoolType,
//         ownership,
//         store_id,
//         student_id,
//         storeName,
//         storeType,
//         accountNumber,
//         agent_id,
//         agentName,
//         email: email.toLowerCase().trim(),
//         phone,
//         profilePicture,
//         schoolRegistrationLink: dynamicSchoolLink,
//         boarding,
//         accountNumber,
//         password: hashedPassword,
//         refreshToken: null,
//         role,
//         schoolId: generatedSchoolId,
//         regUseristrationDate: new Date(),
//         status:'Inactive'
//       });
  
//       await newUser.save();
  
      
//   // Create wallet for the new user
//   const userWallet = await Wallet.create({
//         userId: newUser._id,
//         currency: 'NGN',
//         type: 'user',
//         balance: 0,
//         email: newUser.email,
//         firstName: newUser.firstName,
//         lastName: newUser.lastName,
//         phone: newUser.phone,
        
//       });
  
//       console.log("System wallet created:", userWallet._id);

//   // Create Wallet for system
//   // const systemWallet = await Wallet.findOne({ type: 'system' });

//   // Send email notification
//   const emailDetails = {
//     to: [process.env.EMAIL_TO, newUser.email],
//     from: {
//       email: "davidt@yungmindsinnovative.com.ng",
//       name: 'Xpay School Wallet'
//     },
//     subject: 'Login Notification',
//     text: `Hello ${newUser.firstName},\n\nYou have successfully registered with the school wallet solution.\n\nBest regards,\nYour Company Name`,
//     html: `<p>Hello ${newUser.firstName},</p><p>You have successfully registered with the school wallet solution. <br/> Click the link <a href='${process.env.NGROK_URL}/api/activated/${newUser._id}'>activate</a> to activate your account</p><p>Best regards,<br>Your Company Name</p>`
//   };
  
//   sgMail
//     .send(emailDetails)
//     .then(() => {
//       console.log('Registeration email sent successfully to', newUser.email);
//     })
//     .catch((error) => {
//       console.error('Failed to send login email:', error.response?.body || error.message);
//     });
  
//   res.status(201).json({
//     message: 'Registration successful',
//     User: {
//       id: newUser._id,
//       email: newUser.email,
//       role: newUser.role,
//       firstName: newUser.firstName,
//       lastName: newUser.lastName,
//       name: newUser.name,
//       accountNumber: newUser.accountNumber,
//       ...roleSpecificId,
//       ...(dynamicSchoolLink && { schoolRegistrationLink: dynamicSchoolLink })
//     }
//   });
  
//     }     
//     catch (err) {
//       res.status(500).json({ message: err.message });
//     }
//   }


sgMail.setApiKey(process.env.SENDGRID_API_KEY);


  exports.logout = async (req, res) => { 
    try {
      // Find user by the refreshToken or req.user.id (ensure that req.user is populated, if using auth middleware)
      const user = await regUser.findById(req.user.id); 
  
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }
  
      // Remove the refreshToken from the user's document
      user.refreshToken = null;
      await user.save();
  
      // Clear the refreshToken cookie
      res.clearCookie('refreshToken', {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
      });
  
      // Send a success response
      res.status(200).json({ message: 'Logout successful' });
    } catch (err) {
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  //Update user by id
    // exports.updateUser = async (req, res) => {
    //   try {
    //     const updates = req.body; // Get updates from request body
    //     console.log("Updates received:", updates);
    //     const userId = req.params.id; // Target user to update
    //     console.log("User ID to update:", userId);
    //     const currentUserId = req.user?.id; // User making the request
    //     const currentUser = await regUser.findById(currentUserId); // Fetch current user details
    //     if (!currentUser) {
    //       return res.status(401).json({ message: "Unauthorized" });
    //     }
    
    //     const isSelf = currentUser.id === userId;
    //     const allowedByRole = ['student', 'store', 'agent'].includes(currentUser.role.toLowerCase());
    
    //     if (allowedByRole && !isSelf) {
    //       return res.status(403).json({ message: "Forbidden: You can only update your own record" });
    //     }
    
    //     if (currentUser.role.toLowerCase() !== 'school' && !isSelf) {
    //       return res.status(403).json({ message: "Forbidden: You are not authorized to update this user" });
    //     }
    
        
    
    //     if (!updates || Object.keys(updates).length === 0) {
    //       return res.status(400).json({ message: "No fields provided for update" });
    //     }
    
    //     const allFieldsEmpty = Object.values(updates).every(value => {
    //       if (typeof value === 'object' && value !== null) {
    //         return Object.values(value).every(v => v === null || v === '');
    //       }
    //       return value === null || value === '';
    //     });
    
    //     if (allFieldsEmpty) {
    //       return res.status(400).json({ message: "All fields are empty" });
    //     }
    
    //     const updateData = { ...updates };
    
    //     // Nest object updates
    //     if (updates.academicDetails) {
    //       updateData.academicDetails = {
    //         classAdmittedTo: updates.academicDetails.classAdmittedTo,
    //         section: updates.academicDetails.section,
    //         previousSchool: updates.academicDetails.previousSchool,
    //         admissionDate: updates.academicDetails.admissionDate,
    //         boarding: updates.academicDetails.boarding
    //       };
    //     }
    
    //     const updatedUser = await regUser.findByIdAndUpdate(
    //       userId,
    //       { $set: updateData },
    //       { new: true, runValidators: true }
    //     );
    
    //     if (!updatedUser) {
    //       return res.status(404).json({ message: "User not found" });
    //     }
    
    //     res.status(200).json({
    //       message: "User updated successfully",
    //       user: updatedUser
    //     });
    
    //   } catch (error) {
    //     res.status(500).json({ message: error.message });
    //   }
    // };

    exports.updateUser = async (req, res) => {
      try {
        const userId = req.params.id; // Target user to update
        
        const currentUserId = req.user?.id; // User making the request
    
        const currentUser = await regUser.findById(currentUserId); // Requester
        if (!currentUser) {
          return res.status(401).json({ message: "Unauthorized" });
        }
    
        const isSelf = currentUser.id === userId;
        const allowedByRole = ['student', 'store', 'agent', 'parent'].includes(currentUser.role.toLowerCase());
    
        // Role-based access check
        if (allowedByRole && !isSelf) {
          return res.status(403).json({ message: "Forbidden: You can only update your own record "+allowedByRole+' '+isSelf + '' + userId + '' + currentUserId});
        }
    
        if (currentUser.role.toLowerCase() !== 'school' && !isSelf) {
          return res.status(403).json({ message: "Forbidden: You are not authorized to update this user" });
        }
    
        const updates = req.body;
        if (!updates || Object.keys(updates).length === 0) {
          return res.status(400).json({ message: "No fields provided for update" });
        }
    
        // Check if all fields are empty or null
        const allFieldsEmpty = Object.values(updates).every(value => {
          if (typeof value === 'object' && value !== null) {
            return Object.values(value).every(v => v === null || v === '');
          }
          return value === null || value === '';
        });
    
        if (allFieldsEmpty) {
          return res.status(400).json({ message: "All fields are empty" });
        }
    
        // Restricted fields
        delete updates.email;
        delete updates.password;
    
        const updateData = { ...updates };
    
        // Get the actual user being updated
        const targetUser = await regUser.findById(userId);
        if (!targetUser) {
          return res.status(404).json({ message: "User not found" });
        }
    
        // Rebuild name if either firstName or lastName is provided
        if (updates.firstName || updates.lastName) {
          const firstName = updates.firstName && updates.firstName.trim() !== ''
            ? updates.firstName
            : targetUser.firstName;
    
          const lastName = updates.lastName && updates.lastName.trim() !== ''
            ? updates.lastName
            : targetUser.lastName;
    
          updateData.name = `${firstName} ${lastName}`.trim();
        }
    
        // Handle nested object updates like academicDetails
        if (updates.academicDetails) {
          updateData.academicDetails = {
            classAdmittedTo: updates.academicDetails.classAdmittedTo,
            section: updates.academicDetails.section,
            previousSchool: updates.academicDetails.previousSchool,
            admissionDate: updates.academicDetails.admissionDate,
            boarding: updates.academicDetails.boarding
          };
        }
    
        const updatedUser = await regUser.findByIdAndUpdate(
          userId,
          { $set: updateData },
          { new: true, runValidators: true }
        );
    
        if (!updatedUser) {
          return res.status(404).json({ message: "User not found after update" });
        }
    
        return res.status(200).json({
          message: "User updated successfully",
          user: updatedUser
        });
    
      } catch (error) {
        return res.status(500).json({ message: error.message });
      }
    };
    
  
  //forgot password

  exports.forgotPassword = async (req, res) => {
    try {
      const {email} = req.body;
  
      const user = await regUser.findOne({ email: email.toLowerCase().trim() });
      // console.log("User found:", user);
  
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
  
      const token = crypto.randomBytes(20).toString('hex');
  
      user.resetPasswordToken = token;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  
      await user.save();
  
      const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
      await sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html: `<p>Hello ${user.firstName || ''},</p>
             <p>You requested a password reset. Click the link below to reset it:</p>
             <a href="${resetLink}">Reset Password</a>
              <p>This link will expire in 1 hour.</p>`
    });
  
      
      res.status(200).json({
        success: true,
        message: `Reset password link has been sent to your email, ${user.email}`
      });
    } catch (error) {
      console.error('Forgot Password Error:', error.message);
      res.status(500).json({ success: false, message: 'Error sending reset email' });
    }
  };
//send reset link to email
exports.sendResetLink = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await regUser.find({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    // Generate a reset token
    const token = crypto.randomBytes(20).toString('hex');
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();
    const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
    console.log("Reset link generated:", resetLink);
    console.log("User email:", user.email);
    // Send the reset link via email
    await sendEmail({
      to: email,
      subject: 'Password Reset Request',
      html: `<p>Hello ${user.firstName || ''},</p>
             <p>You requested a password reset. Click the link below to reset it:</p>
             <a href="${resetLink}">${resetLink}</a>
              <p>This link will expire in 1 hour.</p>`
    });
    res.status(200).json({
      success: true,
      message: `Reset password link has been sent to your email, ${user.email}`
    });
  } catch (error) {
    console.error('Send Reset Link Error:', error.message);
    res.status(500).json({ success: false, message: 'Error sending reset email' });
  }
};

//reset password
exports.resetWithToken = async (req, res) => {
  try {
    const { token } = req.params;
    const newPassword = req.body.password;
    console.log("Reset token:", token);
    console.log("New password:", newPassword);

    const user = await regUser.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() }
    });
    
    if (!user) {
      return res.status(400).json({ success: false, message: 'Invalid or expired token' });
    }

    const salt = await bcrypt.genSalt(10);
    // Hash the new password
    console.log("Hashing new password with salt:", salt);
    user.password = await bcrypt.hash(newPassword, salt);
    console.log("New password hashed:", user.password);
    // Clear the reset token and expiration time
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;

    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully.'
    });
  } catch (error) {
    console.error('Reset Password Error:', error.message);
    res.status(500).json({ success: false, message: `Error resetting password ${error.message}` });
  }
};

//update password

exports.updatePassword = async (req, res) => {
  const isStrongPassword = (password) => {
    const minLength = 8;
    const hasUpper = /[A-Z]/.test(password);
    const hasLower = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSymbol = /[\W_]/.test(password);
    return (
      password.length >= minLength &&
      hasUpper &&
      hasLower &&
      hasNumber &&
      hasSymbol
    );
  };
  try {
    const userId = req.user?.id;
    const { currentPassword, newPassword } = req.body;
    console.log("User ID:", userId);
    console.log("Current password:", currentPassword);

    if (!currentPassword || !newPassword) {
      return res.status(400).json({ success: false, message: "Both current and new passwords are required." });
    }

    const user = await regUser.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found." });
    }

    // Compare current password with the stored hashed password
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Current password is incorrect." });
    }

    // Prevent reusing the same password
    const isSameAsOld = await bcrypt.compare(newPassword, user.password);
    if (isSameAsOld) {
      return res.status(400).json({ success: false, message: "New password must be different from the current password." });
    }
    // Check password strength
    if (!isStrongPassword(newPassword)) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 8 characters long and include uppercase, lowercase, numbers, and special characters."
      });
    }
    // Hash and save new password
    const salt = await bcrypt.genSalt(10);
    user.password = await bcrypt.hash(newPassword, salt);
    await user.save();

    return res.status(200).json({ success: true, message: "Password updated successfully." });
  } catch (error) {
    console.error("Update Password Error:", error.message);
    return res.status(500).json({ success: false, message: `Error updating password: ${error.message}` });
  }
};


  exports.deleteUser = async (req, res) => {
      try {
        const userId = req.user?.id; // User making the request
        const currentUser = await regUser.findById(userId); // Fetch current user details
        if (!currentUser) {
            return res.status(401).json({ message: "Unauthorized" });
        }
        //check if the current user is a school or admin or store
        if (currentUser.role.toLowerCase() !== 'school' && currentUser.role.toLowerCase() !== 'admin' && currentUser.role.toLowerCase() !== 'store') {
            return res.status(403).json({ message: "Forbidden: You are not authorized to delete this user" });
        }
          const id = req.params.id;
          const result = await regUser.findByIdAndDelete(req.params.id);
          if (!result) {
              return res.status(404).json({ message: `${result.name} not found` });
          }
          res.status(200).json({ message: `${result.firstName} has deleted successfully` });
      }
      catch (error) {
          res.status(500).json({ message: error.message });
      }
  }

  exports.deleteAllUsers = async (req, res) => {
    try {
      const userId = req.user?.id; // User making the request
      const currentUser = await regUser.findById(userId); // Fetch current user details
      if (!currentUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
      // Check if the current user is a school or admin or store
      if (currentUser.role.toLowerCase() !== 'school' && currentUser.role.toLowerCase() !== 'admin' && currentUser.role.toLowerCase() !== 'store') {
        return res.status(403).json({ message: "Forbidden: You are not authorized to delete all users" });
      }
      const result = await regUser.deleteMany({}); // No filter: deletes ALL users
      if (result.deletedCount === 0) {
        return res.status(404).json({ message: 'No users found to delete' });
      }
      res.status(200).json({ message: `${result.deletedCount} users deleted successfully` });
    } catch (error) {
      res.status(500).json({ message: 'Error deleting users', error });
    }
  };
  
  
  // Step 1: Verify sender and receiver wallet
exports.verifySenderAndReceiver = async (req, res) => {
  const senderId = req.user?.id;
  const { receiverWalletId, description } = req.body;

  try {
    const sender = await regUser.findById(senderId);
    if (!sender) return res.status(404).json({ error: 'Sender not found' });

    const receiver = await regUser.findOne({ walletId: receiverWalletId });
    if (!receiver) return res.status(404).json({ error: 'Receiver not found' });

    // You can optionally store the transfer info in session or return receiver ID
    res.json({ 
      message: 'Sender and receiver verified successfully', 
      receiverId: receiver._id 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// register2
const getDefaultClasses = (schoolType) => {
  switch (schoolType.toLowerCase()) {
    case 'primary':
      return ['Nur 1','Nur 2','Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'];
    case 'secondary':
      return ['JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3'];
    case 'primary and secondary':
      return [
        'Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6',
        'JSS 1', 'JSS 2', 'JSS 3', 'SS 1', 'SS 2', 'SS 3'
      ];
    case 'university':
      return ['100 Level', '200 Level', '300 Level', '400 Level', '500 Level', '600 Level'];
    case 'polytechnic':
      return ['ND 1', 'ND 2', 'HND 1', 'HND 2'];
    default:
      return [];
  }
};
exports.register = async (req, res) => {
  try {
    // Decode registration token if provided
    let decodedToken = {};
    if (req.body.token) {
      try {
        decodedToken = jwt.verify(req.body.token, process.env.JWT_SECRET);
      } catch (err) {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }
    }

    const {
      firstName,
      lastName,
      name = firstName + ' ' + lastName,
      gender,
      dateOfBirth,
      country,
      boarding,
      email,
      phone,
      password,
      profilePicture,
      storeName,
      storeType,
      ownership,
      store_id,
      student_id,
      section,
      schoolName,
      schoolType,
      schoolAddress,
      agentName,
      Class,
      role,
      academicDetails,
      classId,
      pin,
      lastLogin,
      agent_id,
      referalCode,
      schoolRegistrationLink,
      refreshToken,
      status = 'Inactive',
      
    } = req.body;

    const roleLower = role.toLowerCase();
    const schoolId = decodedToken.id || req.body.schoolId || req.query.schoolId || '';
    let resolvedSchoolId = schoolId;
    let resolvedSchoolName = decodedToken.name || req.body.schoolName || req.query.schoolName || '';
    let resolvedSchoolType = decodedToken.type || req.body.schoolType || req.query.schoolType || '';
    let resolvedSchoolAddress = decodedToken.address || req.body.schoolAddress || req.query.schoolAddress || '';
    let resolvedOwnership = decodedToken.ownership || req.query.ownership || '';
    // Check if schoolId is provided for student or store roles
    if ((roleLower === 'student' || roleLower === 'store') && schoolId) {
      const schoolUser = await regUser.findOne({ schoolId, role: 'school' });
      if (!schoolUser) {
        return res.status(404).json({ message: 'School with provided ID not found' });
      }
      resolvedSchoolName = schoolUser.schoolName;
      resolvedSchoolType = schoolUser.schoolType;
      resolvedSchoolAddress = schoolUser.schoolAddress;
      resolvedOwnership = schoolUser.ownership;
      resolvedSchoolId = schoolUser.schoolId;
    }


    const address = {
      street: req.body.street,
      city: req.body.city,
      state: req.body.state,
      zipCode: req.body.zipCode
    };

    const guardian = {
      fullName: req.body.guardianFullName,
      relationship: req.body.guardianRelationship,
      email: req.body.guardianEmail,
      phone: req.body.guardianPhone,
      occupation: req.body.guardianOccupation,
      address: req.body.guardianAddress
    };
    if (req.body.guardianEmail) {
      const existingGuardian = await regUser.findOne({ email: req.body.guardianEmail });
      if (existingGuardian) {
        guardian.fullName = existingGuardian.name || guardian.fullName;
        guardian.email = existingGuardian.email;
        guardian.phone = existingGuardian.phone || guardian.phone;
      }
    }


    const academic = {
      classAdmittedTo: req.body.classAdmittedTo,
      section: req.body.section,
      previousSchool: req.body.previousSchool,
      admissionDate: req.body.admissionDate,
      boarding: req.body.boarding
    };

    const existingUser = await regUser.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }
// Helper to generate 10-digit account number starting with 9
    const generateAccountNumber = () => Math.floor(9000000000 + Math.random() * 1000000000).toString();

    let accountNumber;
    let isUnique = false;
    while (!isUnique) {
      accountNumber = generateAccountNumber();
      const exists = await regUser.findOne({ accountNumber });
      if (!exists) isUnique = true;
    }
//
    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let generatedSchoolId = schoolId;
    if (role.toLowerCase() === 'school' && !schoolId) {
      const nameClean = schoolName.toUpperCase().replace(/[^A-Z]/g, '');
      const letters = (nameClean[0] || 'X') + (nameClean[1] || 'Y') + (nameClean[2] || 'Z');
      const numbers = Math.floor(100000 + Math.random() * 900000).toString();
      generatedSchoolId = `${letters}${numbers}`;
    }

    let roleSpecificId = {};
    let dynamicSchoolLink = '';

    const newUser = new regUser({
      firstName,
      lastName,
      name,
      gender,
      dateOfBirth,
      profilePicture,
      address,
      guardian,
      schoolId: generatedSchoolId,
      academicDetails: academic,
      country,
      schoolName,
      schoolAddress,
      schoolType,
      ownership,
      store_id,
      section,
      student_id,
      storeName,
      storeType,
      accountNumber,
      agent_id,
      agentName,
      Class,
      email: email.toLowerCase().trim(),
      phone,
      schoolRegistrationLink: '',
      boarding,
      password: hashedPassword,
      refreshToken: null,
      role,
      pin: '',
      lastLogin,
      referalCode,
      registrationDate: new Date(),
      status: 'Inactive',
    });
    let schoolDBID = null;
    if (roleLower !== 'school'&&roleLower !== 'parent'&&roleLower !== 'admin') {
  const existingSchool = await regUser.findOne({ schoolId: generatedSchoolId, role: 'school' });
  if (!existingSchool) {
    return res.status(404).json({ message: 'School with provided ID not found' });
  }
  schoolDBID = existingSchool._id;
}
// ✅ Assign student to class using class name (classAdmittedTo)
    if (roleLower === 'student' && academicDetails.classAdmittedTo && schoolDBID) {
      const foundClass = await ClassUser.findOne({
        className: academicDetails.classAdmittedTo,
        schoolId: schoolDBID
      });
      const currentTerm = req.body.term || 'First Term';
      const currentSession = req.body.session || '2025';


      if (!foundClass) {
        return res.status(404).json({ message: `Class '${academicDetails.classAdmittedTo}' not found for this school.` });
      }
          const classFees = await Fee.find({ 
              classId: foundClass._id, 
              term: currentTerm, 
              session: currentSession 
            });

          for (const fee of classFees) {
              const exists = await FeeStatus.findOne({ studentId: newUser._id, feeId: fee._id });
              if (!exists) {
                await FeeStatus.create({ studentId: newUser._id, feeId: fee._id });
              }
            }

      newUser.academicDetails.classAdmittedTo = foundClass.className;
     //update the students section of the class
      newUser.Class = foundClass._id;
      newUser.classId = foundClass._id;
      foundClass.students.push(newUser._id);
      await foundClass.save();

      //set the Transaction Limit for the student based on class

      // Optional: push student to class' student list
      // await ClassUser.findByIdAndUpdate(foundClass._id, { $push: { students: newUser._id } });
    }
    console.log("newUserclass", newUser.Class); 

    switch (role.toLowerCase()) {
      case 'student':
        roleSpecificId = { student_id: `${generatedSchoolId}/${newUser._id}` };
        break;
      case 'agent':
        roleSpecificId = { agent_id: `${store_id}/${newUser._id}` };
        break;
      case 'store':
        roleSpecificId = { store_id: `${generatedSchoolId}/${newUser._id}` };
        dynamicSchoolLink = `/?store_id=${encodeURIComponent(store_id)}&storeName=${encodeURIComponent(storeName)}&storeType=${encodeURIComponent(storeType)}`;
        break;
      case 'school':
        roleSpecificId = { schoolId: generatedSchoolId };
        dynamicSchoolLink = `/?schoolId=${encodeURIComponent(generatedSchoolId)}&schoolName=${encodeURIComponent(schoolName)}&schoolAddress=${encodeURIComponent(schoolAddress)}&schoolType=${encodeURIComponent(schoolType)}&ownership=${encodeURIComponent(ownership)}`;
        //create transfer charge for school
      let transferCharges =   await Charge.create({
          name: `${newUser.schoolName} Transfer Charge`,
          schoolId: generatedSchoolId,
          chargeType: 'Flat',
          amount: 2,
          description: 'Default transfer charge for school',
        });
        //create withdrawal charge for school
      let withdrawalCharges =  await Charge.create({
          name: `${newUser.schoolName} Withdrawal Charge`,
          schoolId: generatedSchoolId,
          chargeType: 'Flat',
          amount: 100,
          description: 'Default withdrawal charge for school',
        });
        //create funding charge for school
       let fundingCharge = await Charge.create({
          name: `${newUser.schoolName} Funding Charge`,
          schoolId: generatedSchoolId,
          chargeType: 'Percentage',
          amount: 1.9,
          description: 'Default funding charge for school',
        });
        //create transfer to agent charge for school
       let transferToAgent = await Charge.create({
          name: `${newUser.schoolName} Transfer to Agent Charge`,
          schoolId: generatedSchoolId,
          chargeType: 'Flat',
          amount: 7,
          description: 'Default transfer to agent charge for school',
        });
        break;
    }

    Object.assign(newUser, roleSpecificId);
    if (dynamicSchoolLink) {
      newUser.schoolRegistrationLink = dynamicSchoolLink;
    }

    await newUser.save();

    // ✅ Create default Transaction Limit automatically for students only
if (roleLower === 'student') {
  try {
    await TransactionLimit.create({
      studentId: newUser._id,   // link to the student
    });
  } catch (limitError) {
    console.error('Error creating default transaction limit:', limitError);
  }
}
//
    // Create classes for school if role is 'school'
    if (roleLower === 'school') {
      const defaultClasses = getDefaultClasses(schoolType);
      const classDocuments = defaultClasses.map(className => ({
        className,
        section: req.body.section || '1',
        schoolId: newUser._id
      }));
      await ClassUser.insertMany(classDocuments);
    }


    // Create wallet
    await Wallet.create({
      userId: newUser._id,
      currency: 'NGN',
      type: 'user',
      balance: 0,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      phone: newUser.phone,
      accountNumber: newUser.accountNumber
    });

    // Generate QR code data
    const qrData = JSON.stringify({
      email: newUser.email,
      name: newUser.name
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrData);
    newUser.qrcode = qrCodeDataUrl;
    await newUser.save();
    const base64Image = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');
    // If role is 'admin', remove QR code and delete wallet
     if (roleLower === 'admin') {
      newUser.qrcode = null;
      await newUser.save();
      await Wallet.deleteOne({ userId: newUser._id });
    }
    

    // const emailDetails = {
    //   to: [process.env.EMAIL_TO, newUser.email],
    //   from: {
    //     email: "davidt@yungmindsinnovative.com.ng",
    //     name: 'Xpay School Wallet'
    //   },
    //   subject: 'Register Notification',
    //   text: `Hello ${newUser.firstName},\n\nYou have successfully registered with the school wallet solution.\n\nBest regards,\nYour Company Name`,
    //   html: `<p>Hello ${newUser.firstName},</p>
    //          <p>You have successfully registered with the school wallet solution.<br/>
    //          Click the link <a href='${process.env.NGROK_URL}/api/activated/${newUser._id}'>activate</a> to activate your account.</p>
    //          <p>Best regards,<br>Your Company Name</p>`,
    //   attachments: [
    //     {
    //       content: base64Image,
    //       filename: 'qrcode.png',
    //       type: 'image/png',
    //       disposition: 'attachment'
    //     }
    //   ]
    // };
    await sendEmail({
    to: newUser.email,
    subject: 'Confirm Notification',
    html: `<p>Hello ${newUser.firstName},</p>
             <p>You have successfully registered with the school wallet solution.<br/>
             Click the link <a href='${process.env.NGROK_URL}/api/activate/${newUser._id}'>activate</a> to activate your account.</p>
             <p>Best regards,<br>Xpay</p>`,
      attachments: [
        {
          content: base64Image,
          filename: 'qrcode.png',
          type: 'image/png',
          disposition: 'attachment'
        }
      ]
  });

    // await sgMail.send(emailDetails);

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: newUser._id,
        email: newUser.email,
        name: newUser.name,
        accountNumber: newUser.accountNumber,
        transferCharge: transferCharges.amount,
        withdrawalCharge: withdrawalCharges.amount,
        fundingCharge: fundingCharge.amount,
        transferToAgentCharge: transferTogent.amount,
        ...roleSpecificId,
        ...(dynamicSchoolLink && { schoolRegistrationLink: dynamicSchoolLink })
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 10 * 1024 * 1024 } }); // 10MB

// middleware to handle file upload; expose as route-level middleware
exports.uploadFileMiddleware = upload.single('file');

// Helper: parse buffer of xlsx/csv into array of objects
function parseSpreadsheetBuffer(buffer, filename) {
  // For CSV/XLSX both use XLSX.read
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  const sheetName = workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  // Convert to JSON (header row expected)
  const json = XLSX.utils.sheet_to_json(sheet, { defval: '' });
  return json; // array of row objects keyed by header names
}

/**
 * Bulk register endpoint.
 * Accepts:
 *  - multipart/form-data with 'file' (xlsx or csv) OR
 *  - application/json with body: { users: [ { ... }, ... ] }
 *
 * Response:
 *  { total: N, successes: [...], errors: [...] }
 */
exports.bulkRegister = async (req, res) => {
  try {
    const userId = req.user?.id;
    console.log("Bulk register initiated by user ID:", userId);

    if(!userId){
      return res.status(401).json({ message: 'Unauthorized: No user ID found in request' });
    }

    const currentUser = await regUser.findById(userId);
    if (!currentUser) {
      return res.status(401).json({ message: 'Unauthorized: User not found' });
    }
    const schoolRole = currentUser.role.toLowerCase()
    const schoolId = currentUser.schoolId || '';
    console.log("Bulk register initiated by user with role:", schoolRole, "and schoolId:", schoolId);
    if (schoolRole !== 'school') {
      return res.status(403).json({ message: 'Forbidden: Only school can bulk register' });
    }
    let rows = [];

    // If file uploaded (via uploadFileMiddleware)
    if (req.file && req.file.buffer) {
      // parse file buffer
      try {
        rows = parseSpreadsheetBuffer(req.file.buffer, req.file.originalname);
      } catch (err) {
        return res.status(400).json({ message: 'Unable to parse uploaded file', details: err.message });
      }
    } else if (Array.isArray(req.body.users)) {
      // JSON body with users
      rows = req.body.users;
    } else if (req.body && typeof req.body === 'object' && Object.keys(req.body).length && req.is('application/json')) {
      // maybe the client posted JSON array directly as body (e.g., raw array)
      if (Array.isArray(req.body)) rows = req.body;
      else if (Array.isArray(req.body.users)) rows = req.body.users;
      else return res.status(400).json({ message: 'No file uploaded and no users array in body' });
    } else {
      return res.status(400).json({ message: 'No file uploaded and no users array in body' });
    }

    // Optionally accept a registration token header or body token to be used for every row
    let decodedToken = {};
    const token = req.body.token || req.headers['x-registration-token'] || null;
    if (token) {
      try {
        decodedToken = jwt.verify(token, process.env.JWT_SECRET);
      } catch (err) {
        return res.status(400).json({ message: 'Invalid/expired registration token' });
      }
    }

    const successes = [];
    const errors = [];

    // Process rows sequentially to avoid race conditions on unique fields.
    // If you want more speed, you can run in parallel batches, but ensure uniqueness checks handle concurrency.
    for (let idx = 0; idx < rows.length; idx++) {
      const row = rows[idx];

      // Map headers from Excel to your expected fields.
      // IMPORTANT: ensure the header names in the spreadsheet match these
      const payload = {
        firstName: row.firstName || row['First Name'] || row['firstname'] || row['FirstName'] || '',
        lastName: row.lastName || row['Last Name'] || row['lastname'] || row['LastName'] || '',
        email: row.email || row['Email'] || '',
        phone: row.phone || row['Phone'] || '',
        role: row.role || row['Role'] || 'student',
        password: row.password || row['Password'] || 'DefaultPassword123!', // you may want to force a random password
        schoolId: schoolId || row['School ID'] || row['SchoolId'] || '',
        schoolName: row.schoolName || row['School Name'] || '',
        schoolType: row.schoolType || row['School Type'] || '',
        schoolAddress: row.schoolAddress || row['School Address'] || '',
        store_id: row.store_id || row['Store ID'] || '',
        storeName: row.storeName || row['Store Name'] || '',
        storeType: row.storeType || row['Store Type'] || '',
        // add any other fields you expect from the sheet (dateOfBirth, gender, address etc.)
        dateOfBirth: row.dateOfBirth || row['Date Of Birth'] || row['DOB'] || null,
        gender: row.gender || row['Gender'] || '',
        street: row.street || row['Street'] || '',
        city: row.city || row['City'] || '',
        state: row.state || row['State'] || '',
        zipCode: row.zipCode || row['Zip'] || '',
        guardianFullName: row.guardianFullName || row['Guardian Full Name'] || '',
        guardianEmail: row.guardianEmail || row['Guardian Email'] || '',
        guardianPhone: row.guardianPhone || row['Guardian Phone'] || '',
        classAdmittedTo: row.classAdmittedTo || row['Class'] || row['classAdmittedTo'] || '',
        section: row.section || row['Section'] || '',
        boarding: row.boarding || row['Boarding'] || '',
        // ...any other fields you need
      };

      try {
        // ✅ 2. Generate a unique password for each user
        payload.password = Math.random().toString(36).slice(-10);

        // ✅ 3. Assign schoolId from the URL parameter
        payload.schoolId = schoolId || '';
        


        // call your helper that contains the single-user create logic
        const result = await createUserFromPayload(payload, decodedToken);
        if (result.success) {
          successes.push({
            row: idx + 1,
            id: result.user._id,
            email: result.user.email,
            message: 'Created'
          });
        } else {
          errors.push({ row: idx + 1, error: result.error || 'Unknown error' });
        }
      } catch (err) {
        // log error and continue
        console.error(`Row ${idx + 1} error:`, err);
        errors.push({ row: idx + 1, error: err.message || 'Server error' });
      }
    }

    res.status(200).json({
      total: rows.length,
      successes,
      errors
    });
  } catch (err) {
    console.error('Bulk register error', err);
    res.status(500).json({ message: 'Server error', details: err.message });
  }
};




exports.register2 = async (req, res) => {
  try {
    let decodedToken = {};
    if (req.body.token) {
      try {
        decodedToken = jwt.verify(req.body.token, process.env.JWT_SECRET);
      } catch (err) {
        return res.status(400).json({ message: 'Invalid or expired token' });
      }
    }

    const {
      firstName,
      lastName,
      name = firstName + ' ' + lastName,
      gender,
      dateOfBirth,
      country,
      boarding,
      email,
      phone,
      password,
      profilePicture,
      storeName,
      storeType,
      ownership,
      store_id,
      student_id,
      section,
      schoolName,
      schoolType,
      schoolAddress,
      agentName,
      Class,
      academicDetails,
      classId,
      pin,
      lastLogin,
      agent_id,
      schoolRegistrationLink,
      refreshToken,
      status = 'Inactive',
      role
    } = req.body;
    const roleLower = role.toLowerCase();
    const schoolId = decodedToken.id || req.body.schoolId || req.query.schoolId || '';
    let resolvedSchoolId = schoolId;
    let resolvedSchoolName = decodedToken.name || req.body.schoolName || req.query.schoolName || '';
    let resolvedSchoolType = decodedToken.type || req.body.schoolType || req.query.schoolType || '';
    let resolvedSchoolAddress = decodedToken.address || req.body.schoolAddress || req.query.schoolAddress || '';
    let resolvedOwnership = decodedToken.ownership || req.query.ownership || '';

    if ((roleLower === 'student' || roleLower === 'store') && schoolId) {
      const schoolUser = await regUser.findOne({ schoolId, role: 'school' });
      if (!schoolUser) {
        return res.status(404).json({ message: 'School with provided ID not found' });
      }

      resolvedSchoolName = schoolUser.schoolName;
      resolvedSchoolType = schoolUser.schoolType;
      resolvedSchoolAddress = schoolUser.schoolAddress;
      resolvedOwnership = schoolUser.ownership;
      resolvedSchoolId = schoolUser.schoolId;
    }

    const address = {
      street: req.body.street,
      city: req.body.city,
      state: req.body.state,
      zipCode: req.body.zipCode
    };

    let guardian = {
      fullName: req.body.guardianFullName,
      relationship: req.body.guardianRelationship,
      email: req.body.guardianEmail,
      phone: req.body.guardianPhone,
      occupation: req.body.guardianOccupation,
      address: req.body.guardianAddress
    };

    if (req.body.guardianEmail) {
      const existingGuardian = await regUser.findOne({ email: req.body.guardianEmail });
      if (existingGuardian) {
        guardian.fullName = existingGuardian.name || guardian.fullName;
        guardian.email = existingGuardian.email;
        guardian.phone = existingGuardian.phone || guardian.phone;
      }
    }

    const academic = {
      classAdmittedTo: req.body.classAdmittedTo,
      section: req.body.section,
      previousSchool: req.body.previousSchool,
      admissionDate: req.body.admissionDate,
      boarding: req.body.boarding
    };

    const existingUser = await regUser.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already in use' });
    }

    const generateAccountNumber = () => Math.floor(9000000000 + Math.random() * 1000000000).toString();

    let accountNumber;
    let isUnique = false;
    while (!isUnique) {
      accountNumber = generateAccountNumber();
      const exists = await regUser.findOne({ accountNumber });
      if (!exists) isUnique = true;
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    let generatedSchoolId = schoolId;
    if (roleLower === 'school' && !schoolId) {
      const nameClean = schoolName.toUpperCase().replace(/[^A-Z]/g, '');
      const letters = (nameClean[0] || 'X') + (nameClean[1] || 'Y') + (nameClean[2] || 'Z');
      const numbers = Math.floor(100000 + Math.random() * 900000).toString();
      generatedSchoolId = `${letters}${numbers}`;
    }

    let roleSpecificId = {};
    let dynamicSchoolLink = '';

    const newUser = new regUser({
      firstName,
      lastName,
      name,
      gender,
      dateOfBirth,
      profilePicture,
      address,
      guardian,
      schoolId: generatedSchoolId,
      academicDetails: academic,
      country,
      schoolName,
      schoolAddress,
      schoolType,
      ownership,
      store_id,
      section,
      student_id,
      storeName,
      storeType,
      accountNumber,
      agent_id,
      agentName,
      Class,
      email: email.toLowerCase().trim(),
      phone,
      schoolRegistrationLink: '',
      boarding,
      password: hashedPassword,
      refreshToken: null,
      role,
      pin: '',
      lastLogin,
      registrationDate: new Date(),
      status: 'Inactive',
    });
    let schoolDBID = null;

if (roleLower !== 'school' && roleLower !== 'parent' && roleLower !== 'admin') {
  const existingSchool = await regUser.findOne({ schoolId: generatedSchoolId, role: 'school' });
  if (!existingSchool) {
    return res.status(404).json({ message: 'School with provided ID not found' });
  }
  schoolDBID = existingSchool._id;
}
//     console.log("shcool_id", schoolDBID);
// console.log("classAdmtrd to", academicDetails.classAdmittedTo); 
// console.log("roleLower", roleLower); 
    // ✅ Assign student to class using class name (classAdmittedTo)
    if (roleLower === 'student' && academicDetails.classAdmittedTo && schoolDBID) {
      const foundClass = await ClassUser.findOne({
        className: academicDetails.classAdmittedTo,
        schoolId: schoolDBID
      });

      if (!foundClass) {
        return res.status(404).json({ message: `Class '${academicDetails.classAdmittedTo}' not found for this school.` });
      }
          const classFees = await Fee.find({ 
              classId: student.classId, 
              term: currentTerm, 
              session: currentSession 
            });

          for (const fee of classFees) {
              const exists = await FeeStatus.findOne({ studentId: student._id, feeId: fee._id });
              if (!exists) {
                await FeeStatus.create({ studentId: student._id, feeId: fee._id });
              }
            }

      newUser.academicDetails.classAdmittedTo = foundClass.className;
     //update the students section of the class
      newUser.Class = foundClass._id;
      foundClass.students.push(newUser._id);
      await foundClass.save();

      // Optional: push student to class' student list
      // await ClassUser.findByIdAndUpdate(foundClass._id, { $push: { students: newUser._id } });
    }
      console.log("newUserclass", newUser.Class); 

    switch (roleLower) {
      case 'student':
        roleSpecificId = { student_id: `${generatedSchoolId}/${newUser._id}` };
        break;
      case 'agent':
        roleSpecificId = { agent_id: `${store_id}/${newUser._id}` };
        break;
      case 'store':
        roleSpecificId = { store_id: `${generatedSchoolId}/${newUser._id}` };
        dynamicSchoolLink = `/?schoolId=${encodeURIComponent(generatedSchoolId)}store_id=${encodeURIComponent(store_id)}&storeName=${encodeURIComponent(storeName)}&storeType=${encodeURIComponent(storeType)}`;
        break;
      case 'school':
        roleSpecificId = { schoolId: generatedSchoolId };
        dynamicSchoolLink = `/?schoolId=${encodeURIComponent(generatedSchoolId)}&schoolName=${encodeURIComponent(schoolName)}&schoolAddress=${encodeURIComponent(schoolAddress)}&schoolType=${encodeURIComponent(schoolType)}&ownership=${encodeURIComponent(ownership)}`;
        break;
    }

    Object.assign(newUser, roleSpecificId);
    if (dynamicSchoolLink) {
      newUser.schoolRegistrationLink = dynamicSchoolLink;
    }

    await newUser.save();

    if (roleLower === 'school') {
      const defaultClasses = getDefaultClasses(schoolType);
      const classDocuments = defaultClasses.map(className => ({
        className,
        section: req.body.section || '1',
        schoolId: newUser._id
      }));
      await ClassUser.insertMany(classDocuments);
    }

    await Wallet.create({
      userId: newUser._id,
      currency: 'NGN',
      type: 'user',
      balance: 0,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      phone: newUser.phone,
      accountNumber: newUser.accountNumber
    });

    const qrData = JSON.stringify({ 
      email: newUser.email,
      // schoolId: newUser.schoolId,
      // role: newUser.role,
      // studentId: roleLower === 'student' ? newUser.student_id : null,
      // name: newUser.name,
      // accountNumber: newUser.accountNumber

    });
    const qrCodeDataUrl = await QRCode.toDataURL(qrData);
    newUser.qrcode = qrCodeDataUrl;
    await newUser.save();
    const base64Image = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');

        // if role is admin, remove qrcode and delete the wallet
    if (roleLower === 'admin') {
      newUser.qrcode = null;
      await newUser.save();
      await Wallet.deleteOne({ userId: newUser._id });
    }

    

    await sendEmail({
    to: newUser.email,
    subject: 'Login Notification',
    html: `<p>Hello ${newUser.firstName},</p>
             <p>You have successfully registered with the school wallet solution.<br/>
             Click the link <a href='${process.env.NGROK_URL}/api/activated/${newUser._id}'>activate</a> to activate your account.</p>
             <p>Best regards,<br>Your Company Name</p>`,
      attachments: [
        {
          content: base64Image,
          filename: 'qrcode.png',
          type: 'image/png',
          disposition: 'attachment'
        }
      ]
  });

    // const emailDetails = {
    //   to: [process.env.EMAIL_TO, newUser.email],
    //   from: {
    //     email: "davidt@yungmindsinnovative.com.ng",
    //     name: 'Xpay School Wallet'
    //   },
    //   subject: 'Registration Notification',
    //   text: `Hello ${newUser.firstName},\n\nYou have successfully registered with the school wallet solution.\n\nBest regards,\nYour Company Name`,
    //   html: `<p>Hello ${newUser.firstName},</p>
    //          <p>You have successfully registered with the school wallet solution.<br/>
    //          Click the link <a href='${process.env.NGROK_URL}/api/activated/${newUser._id}'>activate</a> to activate your account.</p>
    //          <p>Best regards,<br>Your Company Name</p>`,
    //   attachments: [
    //     {
    //       content: base64Image,
    //       filename: 'qrcode.png',
    //       type: 'image/png',
    //       disposition: 'attachment'
    //     }
    //   ]
    // };

    // await sgMail.send(emailDetails);

    res.status(201).json({
      message: 'Registration successful',
      user: {
        id: newUser._id,
        email: newUser.email,
        role: newUser.role,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        name: newUser.name,
        accountNumber: newUser.accountNumber,
        parentId: newUser.parentId,
        ...roleSpecificId,
        ...(dynamicSchoolLink && { schoolRegistrationLink: dynamicSchoolLink })
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};
 exports.getSchoolClasses = async (req, res) => {
    try {
      const userId = req.user?.id; // comes from the token (auth middleware)
      const user = await regUser.findById(userId);
      if (!user) {
        return res.status(404).json({ status: false, message: 'User not found' });
      }
      if (user.role.toLowerCase() !== 'school') {
        return res.status(403).json({ status: false, message: 'Access denied' });
      }
      const classes = await ClassUser.find({ schoolId: user._id });
      if (!classes || classes.length === 0) {
        return res.status(404).json({ status: false, message: 'No classes found' });
      }
  
  
      res.status(200).json({ status: true, data: classes });
    } catch (error) {
      console.error("Error fetching wallet:", error.message);
      res.status(500).json({ status: false, message: 'Server error fetching wallet' });
    }
  };



  
exports.getStudentCountByClass = async (req, res) => {
  try {
    const userId = req.user?.id; // comes from the token (auth middleware) 
    const user = await regUser.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    if (user.role.toLowerCase() !== 'school') {
      return res.status(403).json({ message: 'Access denied' });
    }
    const schoolId = user._id; // School ID from the authenticated user
    const {className = 'Primary 1'} = req.body;

    if (!schoolId || !className) {
      return res.status(400).json({ message: "schoolId and classAdmittedTo are required" });
    }

    const classDoc = await ClassUser.findOne({ schoolId, className });

    if (!classDoc) {
      return res.status(404).json({ message: 'Class not found' });
    }

    const studentCount = classDoc.students.length;

    return res.status(200).json({
      success: true,
      schoolId,
      className,
      studentCount
    });

  } catch (error) {
    console.error('Error fetching student count:', error);
    return res.status(500).json({ success: false, message: 'Server Error' });
  }
};

exports.getAllClassesWithCounts = async (req, res) => {
  try {
   const userId = req.user?.id; // comes from the token (auth middleware)
    const user = await regUser.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const schoolId = user._id; // School ID from the authenticated user
    if (user.role.toLowerCase() !== 'school') {
      return res.status(403).json({ message: 'Access denied' });
    }
    if (!schoolId) {
      return res.status(400).json({ message: 'schoolId is required' });
    }

    // Get all classes for the school, with students populated
    const classes = await ClassUser.find({ schoolId })
      .populate('students', '_id')
      .lean();

    // Return all classes, even if student array is empty
    const result = classes.map(cls => ({
      className: cls.className,
      section: cls.section,
      studentCount: cls.students ? cls.students.length : 0
    }));

    return res.status(200).json({
      success: true,
      totalClasses: result.length,
      data: result
    });

  } catch (error) {
    console.error('Error fetching class student counts:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

//get school by id
exports.getSchoolById = async (req, res) => {
  try {
    const schoolId = req.params.id;

    if (!schoolId) {
      return res.status(400).json({ message: 'schoolId is required' });
    }

    // Find the school using the generated schoolId field
    const school = await regUser.findOne({ schoolId });

    if (!school) {
      return res.status(404).json({ message: 'School not found' });
    }

    if (school.role.toLowerCase() !== 'school') {
      return res.status(403).json({ message: 'Access denied. Not a school user.' });
    }

    // Find classes associated with the school's _id
    const classes = await ClassUser.find({ schoolId: school._id });

    // Convert the Mongoose doc to a plain object
    const schoolData = school.toObject();

    // Attach the related classes (with student counts)
    schoolData.classes = classes.map(cls => ({
      className: cls.className,
      section: cls.section,
      studentCount: cls.students?.length || 0
    }));

    return res.status(200).json({
      success: true,
      data: schoolData
    });

  } catch (error) {
    console.error('Error fetching school:', error);
    return res.status(500).json({ message: 'Server Error' });
  }
};

exports.updateUserProfilePicture = async (req, res) => {
  try {
    const userId = req.user?.id; // comes from the token (auth middleware)
    console.log("userId", userId);

    const user = await regUser.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.profilePicture = req.savedFilePath;
    await user.save();

    res.status(200).json({
      message: 'Profile picture uploaded successfully',
      profilePicture: user.profilePicture
    });
  } catch (err) {
    res.status(500).json({ message: 'Failed to update profile picture', error: err.message });
  }
};
exports.activateUSer = async (req, res) => {
    try{
        const id = req.params.id;
        const user = await regUser.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.role.toLowerCase() === 'school') {
            return res.status(403).json({ message: 'Cannot activate a school user' });
        }
        // check if the user is already active
        if (user.status.toLowerCase() === 'active') {
            return res.status(400).json({ message: 'User is already active' });
        }
        const datatoUpdate = {"status": "Active"};
        const options = { new: true };
        const result = await regUser.findByIdAndUpdate(id, datatoUpdate, options);


        // res.send(result);
        res.status(200).json({message:"user activated successfully"});
    }
    catch (error) {
        res.status(400).json({ message: error.message });
        
    }
};
exports.deactiveUser = async (req, res) => {
    try{
        const id = req.params.id;
        const user = await regUser.findById(id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (user.role.toLowerCase() === 'school') {
            return res.status(403).json({ message: 'Cannot deactivate a school user' });
        }
        // check if the user is already inactive
        if (user.status.toLowerCase() === 'inactive') {
            return res.status(400).json({ message: 'User is already inactive' });
        }
        const datatoUpdate = {"status": "Inactive"};
        const options = { new: true };
        const result = await regUser.findByIdAndUpdate(id, datatoUpdate, options);

        res.status(200).json({message:"user deactivated successfully"});
    }
    catch (error) {
        res.status(400).json({ message: error.message });
        
    }
};