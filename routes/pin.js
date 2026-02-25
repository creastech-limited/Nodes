const express = require('express');
const router = express.Router();
const{setPin, updatePin, adminSetPinForStudent,adminUpdatePinForStudent, verifyOtpAndUpdatePin,requestPinReset} = require('../Controllers/pin');
const verifyToken = require('./verifyToken');

router.post('/set',verifyToken, setPin);
router.post('/setforstudent', verifyToken, adminSetPinForStudent);
router.put('/updateforstudent', verifyToken, adminUpdatePinForStudent);
router.post('/update', verifyToken,updatePin);
router.post('/request-reset', verifyToken, verifyOtpAndUpdatePin);
router.post('/verifyotp', verifyToken, requestPinReset);

module.exports = router;