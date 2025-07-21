const express = require('express');
const router = express.Router();
const { generateOtp, verifyOtpAndUpdateBank } = require('../Controllers/otp');
const verifyToken = require('./verifyToken');       

router.post('/generate', verifyToken, generateOtp); // Route to generate OTP
router.post('/verify', verifyToken, verifyOtpAndUpdateBank); // Route to verify OTP



module.exports = router;