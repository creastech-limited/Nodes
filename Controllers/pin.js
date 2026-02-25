const {regUser} = require('../Models/registeration');
const Otp = require('../Models/otp');
const bcrypt = require('bcryptjs');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
// const generateOTP = require('../Controllers/otp')
const { Resend } = require('resend');
const Wallet = require('../Models/walletSchema');



// Set PIN (initial setup)
exports.setPin = async (req, res) => {
  const currentUserId = req.user?.id;
  const { pin } = req.body;

  try {
    let user = await regUser.findById(currentUserId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Check if PIN is already set
    if (user.pin && user.isPinSet) {
      return res.status(400).json({ error: 'PIN already set' });
    }

    // Validate PIN format
    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'PIN must be 4 digits' });
    }

    const hashedPin = await bcrypt.hash(pin, 10);

    user.pin = hashedPin;
    user.isPinSet = true;

    await user.save();

    res.json({ message: 'PIN set successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//set pin for a student by school or parent
exports.adminSetPinForStudent = async (req, res) => {
  
  try {
    const user = await regUser.findById(req.user?.id);
    // console.log("found user:", user);
    if (!user) return res.status(404).json({ error: 'Unauthorised Access' });
    const { studentEmail, pin } = req.body;
    if (user.role !== 'school' && user.role !== 'parent') {
      return res.status(403).json({ error: 'Only schools or parents can set PIN for students' });
    }
    //check if the parent is a guardian of the student
    if (user.role === 'parent') {
    const student = await regUser.findOne({ email: studentEmail });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const isGuardian = student.guardian && student.guardian.email === user.email;

    if (!isGuardian) {
        return res.status(403).json({ error: 'You are not a guardian of this student' });
    }
}
    
    const student = await regUser.findOne({email: studentEmail});
    // console.log("found student:", student);
    const studentSchoolId = student.schoolId;
    // console.log("student SchoolId:", studentSchoolId);
    const school = await regUser.findOne({schoolId: student.schoolId, role : 'school'});
    // console.log("school Id:", school.schoolId);
    // console.log("student school Name:", school.schoolName);
    // console.log("found school:", school.email);
    if (!student) return res.status(404).json({ error: 'Student not found' });
    //check if the student is a student of the school
    // console.log("User role:", user.role);
    // console.log("Student schoolId:", student.schoolId);
    // console.log("User Email:", user.email);
    // console.log("User schoolId:", user.schoolId);
    // console.log("school Name:", user.schoolName);
    if (user.role === 'school' && student.schoolId !== user.schoolId) {
      return res.status(403).json({ error: 'This student is not registered under your school' });
    }
    // Validate PIN format
    if (!/^\d{4}$/.test(pin)) {
      return res.status(400).json({ error: 'PIN must be 4 digits' });
    }
    const hashedPin = await bcrypt.hash(pin, 10);

    student.pin = hashedPin;
    student.isPinSet = true;
    await student.save();

    res.json({ message: 'PIN set successfully for student' });
  } catch (error) {
    res.status(500).json({ error: error });
  }
};


// Update PIN (requires current PIN)
exports.updatePin = async (req, res) => {
  const currentUserId = req.user?.id
  const {currentPin, newPin } = req.body;

  if (!/^\d{4}$/.test(newPin)) return res.status(400).json({ error: 'New PIN must be 4 digits' });

  try {
    const user = await regUser.findById(currentUserId);
    if (!user || !user.pin) return res.status(404).json({ error: 'PIN not set or user not found' });

    const isMatch = await bcrypt.compare(currentPin, user.pin);
    if (!isMatch) return res.status(401).json({ error: 'Current PIN is incorrect' });

    const hashedPin = await bcrypt.hash(newPin, 10);
    user.pin = hashedPin;
    await user.save();

    res.json({ message: 'PIN updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//admin update pin for a student by school or parent
exports.adminUpdatePinForStudent = async (req, res) => {
  
  try {
    const user = await regUser.findById(req.user?.id);
    if (!user) return res.status(404).json({ error: 'Unauthorised Access' });
    const { studentEmail, newPin } = req.body;
    if (user.role !== 'school' && user.role !== 'parent') {
      return res.status(403).json({ error: 'Only schools or parents can update PIN for students' });
    }
    // console.log("newPin:", newPin); 
    //check if new pin
    const student = await regUser.findOne({email: studentEmail});
    if (!student) return res.status(404).json({ error: 'Student not found' });
    //check if pin is set for student
    if (!student.pin) {
      return res.status(400).json({ error: 'PIN not set for this student, kindly set pin for student' });
    }
    //check if new pin is same as old pin
    const isSamePin = await bcrypt.compare(newPin, student.pin);
    if (isSamePin) {
      return res.status(400).json({ error: 'New PIN cannot be the same as the current PIN' });
    }
    //check if the parent is a guardian of the student
   if (user.role === 'parent') {
    const student = await regUser.findOne({ email: studentEmail });
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const isGuardian = student.guardian && student.guardian.email === user.email;

    if (!isGuardian) {
        return res.status(403).json({ error: 'You are not a guardian of this student' });
    }
}
    //check if the student is a student of the school
    if (user.role === 'school' && student.schoolId !== user.schoolId) {
      return res.status(403).json({ error: 'This student is not registered under your school' });
    }
    // Validate PIN format
    if (!/^\d{4}$/.test(newPin)) {
      return res.status(400).json({ error: 'New PIN must be 4 digits' });
    }
    const hashedPin = await bcrypt.hash(newPin, 10);
    student.pin = hashedPin;
    await student.save();
    res.json({ message: 'PIN updated successfully for student' });
  } catch (error) {
    console.log(error)
    res.status(500).json({ error: error.message });
  }
};

// Verify PIN
exports.verifyPin = async (req, res) => {
  const currentUserId = req.user?.id
  if (!currentUserId) return res.status(400).json({ error: 'User ID is required' });
  const { pin } = req.body;

  try {
    const user = await regUser.findById(currentUserId);
    if (!user || !user.pin) return res.status(404).json({ error: 'PIN not set or user not found' });
    
    const isMatch = await bcrypt.compare(pin, user.pin);
    if (!isMatch) return res.status(401).json({ error: 'Invalid PIN' });

    res.json({ message: 'PIN verified successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//forgot PIN
exports.requestPinReset = async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(400).json({ error: "User ID is required" });

    const {newPin} = req.body
    if(!newPin){
      return res.status(404).json({ error: "PIN field required" })
    }

    const user = await regUser.findById(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    await Otp.deleteMany({ userId });

    const otpCode = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

    await Otp.create({
      userId,
      otp: otpCode,
      expiresAt,
      attempts: 0
    });

    // send email here
    const resend = new Resend(process.env.RESEND_API_KEY); 
    await resend.emails.send({ 
      from: "taiwo.david@xpay.ng", 
      to: user.email, subject: "Login Notification", 
      html: `<p>Your OTP is <strong>${otpCode}</strong>.</p> <p>This code expires in 5 minutes.</p>` , });

    return res.status(200).json({
      otp:otpCode,
      message: "OTP sent to your email"
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Verify PIN
exports.verifyOtpAndUpdatePin = async (req, res) => {
  try {
    const userId = req.user?.id;

    if (!userId) return res.status(400).json({ message: 'userId is required' });

    const user = await regUser.findById(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const { otp, newPin } = req.body;

    if (!otp || !newPin) {
      return res.status(400).json({ message: 'OTP or PIN fields Missing' });
    }

    const otpRecord = await Otp.findOne({ userId });

    if (!otpRecord)
      return res.status(400).json({ message: 'No OTP found for this user' });

    if (otpRecord.expiresAt < new Date()) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: 'OTP expired' });
    }

    if (otpRecord.attempts >= 3) {
      await Otp.deleteOne({ _id: otpRecord._id });
      return res.status(400).json({ message: 'Maximum OTP attempts exceeded' });
    }

    if (otpRecord.otp !== otp) {
      otpRecord.attempts += 1;
      await otpRecord.save();
      return res.status(400).json({ message: 'Invalid OTP' });
    }

    // ✅ Hash the PIN before saving (VERY IMPORTANT)
    const bcrypt = require('bcryptjs');
    const hashedPin = await bcrypt.hash(newPin, 10);

    await regUser.findByIdAndUpdate(userId, {
      pin: hashedPin,
    });

    await Otp.deleteOne({ _id: otpRecord._id });

    //send email
    const resend = new Resend(process.env.RESEND_API_KEY); 
    await resend.emails.send({ 
      from: "taiwo.david@xpay.ng", 
      to: user.email, subject: "Login Notification", 
      html: `<p>Your PIN hasnow been reset.</p>`
       , 
      });

    return res.status(200).json({ message: 'PIN verified successfully' });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
