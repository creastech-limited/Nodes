const {regUser} = require('../Models/registeration');
const bcrypt = require('bcryptjs');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
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
