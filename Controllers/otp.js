const Otp = require('../Models/otp');
const {regUser} = require('../Models/registeration');
const sendEmail  = require('../utils/email'); // Assuming you have a utility function to send emails
const { Resend } = require('resend');

// Generate OTP & Save
exports.generateOtp = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) return res.status(400).json({ message: 'userId is required' });

  const user = await regUser.findById(userId);
  if (!user) return res.status(404).json({ message: 'User not found' });

  console.log("Generating OTP for user:", user.email);

  // Delete any existing OTP for the user
  await Otp.deleteOne({ userId });

  // Generate OTP ONCE
  let otpCode = Math.floor(100000 + Math.random() * 900000).toString();
  let expiresAt = new Date(Date.now() + 50 * 60 * 1000); // 10 minutes
  let timetoExpire = Math.floor((expiresAt - Date.now()) / 1000 / 60); // in minutes
  // console.log("Generated OTP:", otpCode, "Expires At:", expiresAt, "Expires in:", timetoExpire, "minutes");

  // console.log("OTP to be saved:", otpCode, "Expires At:", expiresAt);

  // Save OTP exactly as generated
  await Otp.create({
    userId,
    otp: otpCode,
    expiresAt
  });

  // Optional: Read back from DB to verify
  const savedOtp = await Otp.findOne({ userId });
  otpCode = savedOtp.otp; // Ensure we use the saved OTP for logging
  expiresAt = savedOtp.expiresAt; // Ensure we use the saved expiration time
  timetoExpire = Math.floor((expiresAt - Date.now()) / 1000 / 60); // in minutes
  // console.log("Saved OTP from DB:", otpCode, "Expires in:", timetoExpire, "minutes", "Expires At:", expiresAt);

//   // Send email
const resend = new Resend(process.env.RESEND_API_KEY);

    await resend.emails.send({
      from: "david.taiwo@sovereignfinanceltd.com",
      to: newRecord.email,
      subject: "Login Notification",
      html: `
        <p>Your OTP is <strong>${otpCode}</strong>.</p>
        <p>This code expires in 5 minutes.</p>
      `,
    });
//   await sendEmail(
//     user.email,
//     'Your OTP Code',
//     `Your OTP code is: ${otpCode}, expires in ${timetoExpire} minutes.`
//   )
// await sendEmail(
//     "taiwodavid19@gmail.com",
//     'Your OTP Code',
//     `Your OTP code is: ${otpCode}, expires in ${timetoExpire} minutes.`
//   )
  res.status(200).json({ message: 'OTP sent' }); // NEVER send actual OTP in production
};


//get OTP by userId
exports.getOtpByUserId = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) return res.status(400).json({ message: 'userId is required' });

  const otp = await Otp.findOne({ userId });
  if (!otp) return res.status(404).json({ message: 'OTP not found for this user' });

  res.status(200).json({ otp });
}
// Delete OTP by userId
exports.deleteOtpByUserId = async (req, res) => {
  const userId = req.user?.id;

  if (!userId) return res.status(400).json({ message: 'userId is required' });

  const otp = await Otp.findOneAndDelete({ userId });
  if (!otp) return res.status(404).json({ message: 'OTP not found for this user' });

  res.status(200).json({ message: 'OTP deleted successfully' });
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
