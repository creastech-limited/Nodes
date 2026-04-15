const express = require('express');
const router = express.Router();
const {scanQr, getStudentAttendance, getTodayAttendance} = require('../Controllers/attendance')

router.post('/scan',  scanQr);
router.get('/student/:studentId',  getStudentAttendance);
router.get('/today',  getTodayAttendance);





module.exports = router