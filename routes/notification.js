const express = require('express');
const router = express.Router();
const{getNotifications} = require('../Controllers/notification');
const verifyToken = require('./verifyToken');

router.get('/get',verifyToken, getNotifications);
// router.post('/update', verifyToken,updatePin);
// router.post('/verify', verifyToken, verifyPin);

module.exports = router;