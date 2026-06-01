const express = require('express');
const router = express.Router();
const { getallStudentsInSchoolByAdmin} = require('../Controllers/getAllusers')
const {getAllDisputes} = require('../Controllers/dispute');
const {updateUser} = require('../Controllers/userAuth');
const verifyToken= require("./verifyToken")

router.get('/students/:schoolId', verifyToken,  getallStudentsInSchoolByAdmin);
router.get('/disputes', verifyToken, getAllDisputes);
// router.put('/disputes/:disputeId/resolve', verifyToken, resolveDispute);
router.put('/users/:userId', verifyToken, updateUser);
// router.get('/student/:studentId', verifyToken,  getStudentAttendance);
// router.get('/today', verifyToken,  getTodayAttendance);



module.exports = router