const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

// Generate 6-digit OTP
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

exports.sendWhatsappOtp = async (req, res) => {
  try {
    const { phoneNumber } = req.body; // e.g. "2348140581435"
    if (!phoneNumber) {
      return res.status(400).json({ message: "Phone number is required" });
    }

    // Generate OTP
    const otp = generateOTP();

    // Send WhatsApp Message
    const message = await client.messages.create({
      from: "whatsapp:+14155238886", // Twilio Sandbox or approved number
      body: `Your authentication code is: ${otp} from David`,
      to: `whatsapp:+234${phoneNumber}`,
    });

    // Store OTP in session/DB/Redis for verification later
    // Example just returning (don’t do this in production)
    return res.status(200).json({
      message: "OTP sent successfully via WhatsApps",
      sid: message.sid,
      otp // 🔴 remove this in production
    });

  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: "Error sending OTP", error: error.message });
  }
};
