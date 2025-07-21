const Otp = require('../Models/otp');
const {regUser} = require('../Models/registeration');
const sendEmail  = require('../utils/email'); // Assuming you have a utility function to send emails

// Generate OTP & Save
exports.generateOtp = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) return res.status(400).json({ message: 'userId is required' });
  const user = await regUser.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  console.log("Generating OTP for user:", user.email);

  const otpCode = Math.floor(100000 + Math.random() * 900000).toString();  // 6-digit OTP
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now
  console.log("Generated OTP:", otpCode, "for user:", user.email, "expires at:", expiresAt, "count:", 0);

  await Otp.create({ userId, otp: otpCode, expiresAt });
  //send OTP to user via email
    await sendEmail({
        to: user.email, 
        Subject:'Your OTP Code', 
        html: `Your OTP code is: ${otpCode}, expires in 10 minutes.`});

  res.status(200).json({ message: 'OTP sent', otp: otpCode }); // In real app, send via email/SMS
};

// Verify OTP & Update User
// exports.verifyOtpAndUpdate = async (req, res) => {
//   const { userId, otp, updateData } = req.body;

//   if (!userId || !otp) return res.status(400).json({ message: 'userId and otp are required' });

//   const otpRecord = await Otp.findOne({ userId, otp });

//   if (!otpRecord) return res.status(400).json({ message: 'Invalid OTP' });
//   if (otpRecord.expiresAt < new Date()) return res.status(400).json({ message: 'OTP expired' });

//   // Perform the update
//   await regUser.findByIdAndUpdate(userId, updateData);

//   // Delete OTP after successful use
//   await Otp.deleteOne({ _id: otpRecord._id });

//   res.status(200).json({ message: 'User updated successfully' });
// };
exports.verifyOtpAndUpdateBank = async (req, res) => {
    const userId = req.user?.id;

  if (!userId) return res.status(400).json({ message: 'userId is required' });
  const user = await regUser.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });
  const {otp, accountName, accountNumber, bankName, bankCode } = req.body;

  if (!otp || !accountName || !accountNumber || !bankName || !bankCode) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  const otpRecord = await Otp.findOne({ userId });
  console.log("Verifying OTP for user:", user.email, "OTP:", otp, "Record:", otpRecord);

  if (!otpRecord) return res.status(400).json({ message: 'No OTP found for this user' });
  if (otpRecord.expiresAt > new Date()) {
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

  // ✅ OTP valid — proceed with updating bank details
  await regUser.findByIdAndUpdate(userId, {
    bankDetails: {
      accountName,
      accountNumber,
      bankName,
      bankCode
    }
  });

  await Otp.deleteOne({ _id: otpRecord._id });

  res.status(200).json({ message: 'Bank details updated successfully' });
};
