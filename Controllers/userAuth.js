const QRCode = require('qrcode');
const {regUser, ClassUser} = require('../Models/registeration');
const bcrypt = require('bcryptjs');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Wallet = require('../Models/walletSchema'); // Import Wallet model

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
exports.login = async (req, res) => {
  console.log('POST body:', req.body);

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

    console.log("Access token generated:", accessToken);
    console.log("User details:", {
      id: user._id,});
    // Send response
   return res.status(200).json({
      message: 'Login successful',
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

    // Send Login Email
    const emailDetails = {
      to: process.env.EMAIL_TO,
      from: {
        email: "davidt@yungmindsinnovative.com.ng",
        name: 'Your Company Name'
      },
      subject: 'Login Notification',
      text: `Hello ${user.firstName},\n\nYou have successfully logged in to your account.\n\nBest regards,\nYour Company Name`,
      html: `<p>Hello ${user.firstName},</p><p>You have successfully logged in to your account.</p><p>Best regards,<br>Your Company Name</p>`
    };

    sgMail.send(emailDetails)
      .then(() => {
        console.log('Login email sent successfully to', user.email);
        res.status(200).json({
          message: 'Login email sent successfully',
        });
      })
      .catch((error) => {
        console.error('Failed to send login email:', error.response?.body || error.message);
        return res.status(500).json({
          message: 'Failed to send login email',
        }); 
      });

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
      student_id,
      agentName,
      classAdmittedTo,
      academicDetails,
      pin,
      lastLogin,
      agent_id,
      schoolRegistrationLink,
      refreshToken,
      status = 'Inactive',
      role
    } = req.body;

    const ownership = decodedToken.ownership || req.query.ownership || '';
    const store_id = decodedToken.id || req.body.store_id || req.query.store_id || '';
    const schoolName = decodedToken.name || req.body.schoolName || req.query.schoolName || '';
    const schoolType = decodedToken.type || req.body.schoolType || req.query.schoolType || '';
    const schoolAddress = decodedToken.address || req.body.schoolAddress || req.query.schoolAddress || '';
    const schoolId = decodedToken.id || req.body.schoolId || req.query.schoolId || '';

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
      academicDetails: academic,
      country,
      classAdmittedTo,
      schoolName,
      schoolAddress,
      schoolType,
      ownership,
      store_id,
      student_id,
      storeName,
      storeType,
      accountNumber,
      agent_id,
      agentName,
      email: email.toLowerCase().trim(),
      phone,
      schoolRegistrationLink: '',
      boarding,
      password: hashedPassword,
      refreshToken: null,
      role,
      pin: '',
      lastLogin,
      schoolId: generatedSchoolId,
      registrationDate: new Date(),
      status: 'Inactive'
    });

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
        break;
    }

    Object.assign(newUser, roleSpecificId);
    if (dynamicSchoolLink) {
      newUser.schoolRegistrationLink = dynamicSchoolLink;
    }

    await newUser.save();

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
    });

    const qrCodeDataUrl = await QRCode.toDataURL(qrData);
    newUser.qrcode = qrCodeDataUrl;
    await newUser.save();
    const base64Image = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');

    const emailDetails = {
      to: [process.env.EMAIL_TO, newUser.email],
      from: {
        email: "davidt@yungmindsinnovative.com.ng",
        name: 'Xpay School Wallet'
      },
      subject: 'Login Notification',
      text: `Hello ${newUser.firstName},\n\nYou have successfully registered with the school wallet solution.\n\nBest regards,\nYour Company Name`,
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
    };

    await sgMail.send(emailDetails);

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
        ...roleSpecificId,
        ...(dynamicSchoolLink && { schoolRegistrationLink: dynamicSchoolLink })
      }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: err.message });
  }
};


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
      console.log("User found:", user);
  
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
  
      const token = crypto.randomBytes(20).toString('hex');
  
      user.resetPasswordToken = token;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  
      await user.save();
  
      const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  
      const emailDetails = {
        to: `${user.email}`, // <-- send to actual user email
        from: {
          email: "davidt@yungmindsinnovative.com.ng",
          name: 'Your Company Name'
        },
        subject: 'Password Reset Request',
        html: `<p>Hello ${user.firstName || ''},</p>
               <p>You requested a password reset. Click the link below to reset it:</p>
               <a href="${resetLink}">${resetLink}</a>
               <p>This link will expire in 1 hour.</p>`
      };
  
      sgMail
        .send(emailDetails)
        .then(() => {
          console.log('Reset email sent successfully to', user.email);
          console.log('Reset email sent successfully to', user.resetPasswordToken);
        })
        .catch((error) => {
          console.error('Failed to send reset email:', error.response?.body || error.message);
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
      return ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'];
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
    const shcool_id = await regUser.findOne({ schoolId: generatedSchoolId });
    if (!shcool_id) {
      return res.status(404).json({ message: 'School with provided ID not found' });
    }else {
      schoolDBID = shcool_id._id;
    }
    console.log("shcool_id", schoolDBID);
console.log("classAdmtrd to", academicDetails.classAdmittedTo); 
console.log("roleLower", roleLower); 
    // ✅ Assign student to class using class name (classAdmittedTo)
    if (roleLower === 'student' && academicDetails.classAdmittedTo && schoolDBID) {
      const foundClass = await ClassUser.findOne({
        className: academicDetails.classAdmittedTo,
        schoolId: schoolDBID
      });

      if (!foundClass) {
        return res.status(404).json({ message: `Class '${academicDetails.classAdmittedTo}' not found for this school.` });
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
        dynamicSchoolLink = `/?store_id=${encodeURIComponent(store_id)}&storeName=${encodeURIComponent(storeName)}&storeType=${encodeURIComponent(storeType)}`;
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

    const qrData = JSON.stringify({ email: newUser.email });
    const qrCodeDataUrl = await QRCode.toDataURL(qrData);
    newUser.qrcode = qrCodeDataUrl;
    await newUser.save();
    const base64Image = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');

    const emailDetails = {
      to: [process.env.EMAIL_TO, newUser.email],
      from: {
        email: "davidt@yungmindsinnovative.com.ng",
        name: 'Xpay School Wallet'
      },
      subject: 'Registration Notification',
      text: `Hello ${newUser.firstName},\n\nYou have successfully registered with the school wallet solution.\n\nBest regards,\nYour Company Name`,
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
    };

    await sgMail.send(emailDetails);

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