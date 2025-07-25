const express = require('express');
const router = express.Router();
const { generateOtp, verifyOtpAndUpdateBank, deleteOtpByUserId, getOtpByUserId} = require('../Controllers/otp');
const verifyToken = require('./verifyToken');       

router.post('/generate', verifyToken, generateOtp); // Route to generate OTP
router.post('/verify', verifyToken, verifyOtpAndUpdateBank); // Route to verify OTP
router.delete('/delete', verifyToken, deleteOtpByUserId); // Route to delete OTP by userId
router.get('/get', verifyToken, getOtpByUserId); // Route to get OTP by userId



module.exports = router;