const express = require('express');
const router = express.Router();
const {scanQr, getStudentAttendance, getTodayAttendance} = require('../Controllers/attendance')
const verifyToken= require("./verifyToken")

router.post('/scan', verifyToken,  scanQr);
router.get('/student/:studentId',  getStudentAttendance);
router.get('/today',  getTodayAttendance);





module.exports = router