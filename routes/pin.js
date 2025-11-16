const express = require('express');
const router = express.Router();
const{setPin, updatePin, verifyPin, adminSetPinForStudent,adminUpdatePinForStudent} = require('../Controllers/pin');
const verifyToken = require('./verifyToken');

router.post('/set',verifyToken, setPin);
router.post('/setforstudent', verifyToken, adminSetPinForStudent);
router.put('/updateforstudent', verifyToken, adminUpdatePinForStudent);
router.post('/update', verifyToken,updatePin);
router.post('/verify', verifyToken, verifyPin);

module.exports = router;