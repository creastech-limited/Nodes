const regUser = require('../Models/registeration');
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
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ message: 'Email and password are required' });
  }

  try {
    // Check if user exists
    const user = await regUser.findOne({ email });
    if (!user) return res.status(404).json({ message: 'User not found' });

    console.log("Login attempt:", email);

    // Check if user has a password
    if (!user.password) {
      return res.status(500).json({ message: 'User has no password set' });
    }

    // Compare passwords
    const isMatch = await bcrypt.compare(password, user.password);
    console.log("Password match:", isMatch);
    if (!isMatch) return res.status(401).json({ message: 'Invalid credentials' });

    // Check status
    if (user.status !== 'Active') {
      console.log("User is not active:", user.status);
      return res.status(403).json({ message: 'User is not active' });
    }

    // Create Token
    // const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET_KEY);


    const { accessToken, refreshToken } = generateTokens(user);

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

    console.log("Refresh token set in cookie:", refreshToken);
    console.log("Access token generated:", accessToken);
    console.log("User details:", {
      id: user._id,});
    // Send response
    res.status(200).json({
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
      })
      .catch((error) => {
        console.error('Failed to send login email:', error.response?.body || error.message);
      });

  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ message: err.message });
  }
}


  exports.register = async (req, res) => {
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
      accountNumber,
      address,
      guardian,
      ownership = req.query.ownership ||'',
      storeType,
      store_id = req.query.store_id ||'',
      student_id,
      agentName,
      classAdmittedTo,
      academicDetails,
      agent_id,
      schoolRegistrationLink,
      role,
      schoolName = req.query.schoolName ||'',
      schoolType = req.query.schoolType ||'',
      schoolAddress = req.query.schoolAddress ||'',
      schoolId =req.query.schoolId ||'',
      refreshToken,
      status = 'Inactive'
    } = req.body;
  
    try {
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
  
      const academicDetails = {
        classAdmittedTo: req.body.classAdmittedTo,
        section: req.body.section,
        previousSchool: req.body.previousSchool,
        admissionDate: req.body.admissionDate,
        boarding: req.body.boarding
      };
      // Check if email already exists
      const existingUser = await regUser.findOne({ email: email.toLowerCase().trim() });
      if (existingUser) {
        return res.status(400).json({ message: 'Email already in use' });
      }
  
      // Helper to generate 10-digit account number starting with 9
  const generateAccountNumber =  Math.floor(9000000000 + Math.random() * 1000000000).toString();
  // Generate unique schoolId for 'school' role if not provided
      let generatedSchoolId = schoolId;
      if (role.toLowerCase() === 'school' && !schoolId) {
        const name = schoolName.toUpperCase().replace(/[^A-Z]/g, '');
        const firstLetter = name[0] || 'X';
        const secondLetter = name[1] || 'Y';
        const thirdLetter = name[2] || 'Z';
        const letters = `${firstLetter}${secondLetter}${thirdLetter}`;
        const numbers = Math.floor(100000 + Math.random() * 900000).toString(); // always 6 digits
        generatedSchoolId = `${letters}${numbers}`;
      }
  
  // Inline account number generation
      let accountNumber;
      let isUnique = false;
  
      while (!isUnique) {
          accountNumber = generateAccountNumber;
          const exists = await regUser.findOne({ accountNumber });
          if (!exists) {
            isUnique = true;
          }
        }
  console.log(accountNumber)
      // Hash password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
  
      // Create user
      const newUser = new regUser({
        firstName,
        lastName,
        name,
        gender,
        dateOfBirth,
        profilePicture,
        address,
        guardian,
        academicDetails,
        country,
        academicDetails,
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
        profilePicture,
        schoolRegistrationLink,
        boarding,
        accountNumber,
        password: hashedPassword,
        refreshToken: null,
        role,
        schoolId: generatedSchoolId,
        regUseristrationDate: new Date(),
        status:'Inactive'
      });
  
      await newUser.save();
  
      // Role-based ID generation
      let roleSpecificId = {};
      let dynamicSchoolLink = '';
  
    switch (newUser.role.toLowerCase()) {
    case 'student':
      roleSpecificId = { student_id: `${newUser.schoolId}/${newUser._id}` };
      break;
    case 'agent':
      roleSpecificId = { agent_id: `${newUser.store_id}/${newUser._id}` };
      break;
    case 'store':
      roleSpecificId = { store_id: `${newUser.schoolId}/${newUser._id}` };
      dynamicSchoolLink = `/?store_id=${encodeURIComponent(newUser.store_id)}&storeName=${encodeURIComponent(newUser.storeName)}&storeType=${encodeURIComponent(newUser.storeType)}`;
      break;
    case 'school':
      roleSpecificId = { schoolId: newUser.schoolId };
      dynamicSchoolLink = `/?schoolId=${encodeURIComponent(newUser.schoolId)}&schoolName=${encodeURIComponent(newUser.schoolName)}&schoolAddress=${encodeURIComponent(newUser.schoolAddress)}&schoolType=${encodeURIComponent(newUser.schoolType)}&ownership=${encodeURIComponent(newUser.ownership)}`;
      break;
  }
  // Create wallet for the new user
  const userWallet = await Wallet.create({
        userId: newUser._id,
        currency: 'NGN',
        type: 'user',
        balance: 0,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phone: newUser.phone,
        
      });
  
      console.log("System wallet created:", userWallet._id);

  // Create Wallet for system
  // const systemWallet = await Wallet.findOne({ type: 'system' });

  // Send email notification
  const emailDetails = {
    to: [process.env.EMAIL_TO, newUser.email],
    from: {
      email: "davidt@yungmindsinnovative.com.ng",
      name: 'Xpay School Wallet'
    },
    subject: 'Login Notification',
    text: `Hello ${newUser.firstName},\n\nYou have successfully registered with the school wallet solution.\n\nBest regards,\nYour Company Name`,
    html: `<p>Hello ${newUser.firstName},</p><p>You have successfully registered with the school wallet solution. <br/> Click the link <a href='${process.env.NGROK_URL}/api/activated/${newUser._id}'>activate</a> to activate your account</p><p>Best regards,<br>Your Company Name</p>`
  };
  
  sgMail
    .send(emailDetails)
    .then(() => {
      console.log('Registeration email sent successfully to', newUser.email);
    })
    .catch((error) => {
      console.error('Failed to send login email:', error.response?.body || error.message);
    });
  
  res.status(201).json({
    message: 'Registration successful',
    User: {
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
  
    }     
    catch (err) {
      res.status(500).json({ message: err.message });
    }
  }

  exports.logout = async (req, res) => { 
    try {
      // Find user by the refreshToken or req.user.id (ensure that req.user is populated, if using auth middleware)
      const user = await regUser.findById(req.user.id); 
      console.log("Logout attempt for user:", user.email);
  
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
      console.error('Logout error:', err);
      res.status(500).json({ message: 'Internal server error' });
    }
  };

  //Update user by id
  exports.updateUser = async (req, res) => {
    try {
      const userId = req.params.id; // Target user to update
      console.log("User ID to update:", userId);
      const currentUserId = req.user?.id; // User making the request
      const currentUser = await regUser.findById(currentUserId); // Fetch current user details
      if (!currentUser) {
        return res.status(401).json({ message: "Unauthorized" });
      }
  
      const isSelf = currentUser.id === userId;
      const allowedByRole = ['student', 'store', 'agent'].includes(currentUser.role.toLowerCase());
  
      if (allowedByRole && !isSelf) {
        return res.status(403).json({ message: "Forbidden: You can only update your own record" });
      }
  
      if (currentUser.role.toLowerCase() !== 'school' && !isSelf) {
        return res.status(403).json({ message: "Forbidden: You are not authorized to update this user" });
      }
  
      const updates = req.body;
  
      if (!updates || Object.keys(updates).length === 0) {
        return res.status(400).json({ message: "No fields provided for update" });
      }
  
      const allFieldsEmpty = Object.values(updates).every(value => {
        if (typeof value === 'object' && value !== null) {
          return Object.values(value).every(v => v === null || v === '');
        }
        return value === null || value === '';
      });
  
      if (allFieldsEmpty) {
        return res.status(400).json({ message: "All fields are empty" });
      }
  
      const updateData = { ...updates };
  
      // Nest object updates
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
        return res.status(404).json({ message: "User not found" });
      }
  
      res.status(200).json({
        message: "User updated successfully",
        user: updatedUser
      });
  
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  };
  //forgot password

  exports.forgotPassword = async (req, res) => {
    try {
      const { email } = req.body;
  
      const user = await regUser.findOne({ email: email.toLowerCase().trim() });
  
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
  
      const token = crypto.randomBytes(20).toString('hex');
  
      user.resetPasswordToken = token;
      user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
  
      await user.save();
  
      const resetLink = `${process.env.FRONTEND_URL}/reset-password/${token}`;
  
      const emailDetails = {
        to: `taiwodavid19@gmail.com; ${user.email}`, // <-- send to actual user email
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

  