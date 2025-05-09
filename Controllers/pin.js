const regUser = require('../Models/registeration');
const bcrypt = require('bcryptjs');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Wallet = require('../Models/walletSchema');



// Set PIN (initial setup)
exports.setPin = async (req, res) => {
  const { userId, pin } = req.body;

  if (!/^\d{4,6}$/.test(pin)) return res.status(400).json({ error: 'PIN must be 4-6 digits' });

  try {
    const hashedPin = await bcrypt.hash(pin, 10);
    const user = await regUser.findByIdAndUpdate(userId, { pin: hashedPin }, { new: true });

    if (!user) return res.status(404).json({ error: 'User not found' });

    res.json({ message: 'PIN set successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update PIN (requires current PIN)
exports.updatePin = async (req, res) => {
  const { userId, currentPin, newPin } = req.body;

  if (!/^\d{4}$/.test(newPin)) return res.status(400).json({ error: 'New PIN must be 4 digits' });

  try {
    const user = await regUser.findById(userId);
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
  const { userId, pin } = req.body;

  try {
    const user = await regUser.findById(userId);
    if (!user || !user.pin) return res.status(404).json({ error: 'PIN not set or user not found' });

    const isMatch = await bcrypt.compare(pin, user.pin);
    if (!isMatch) return res.status(401).json({ error: 'Invalid PIN' });

    res.json({ message: 'PIN verified successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
