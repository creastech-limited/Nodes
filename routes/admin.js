const express = require('express');
const router = express.Router();
const { getallStudentsInSchoolByAdmin} = require('../Controllers/getAllusers')
const {getAllDisputes} = require('../Controllers/dispute');
const {updateUser, activateUSer, deactiveUser} = require('../Controllers/userAuth');
const verifyToken= require("./verifyToken")

router.get('/students/:schoolId', verifyToken,  getallStudentsInSchoolByAdmin);
router.get('/disputes/all', verifyToken, getAllDisputes);
router.put('/deactivate-user/:id', verifyToken, deactiveUser);
router.put('/activate-user/:id', verifyToken, activateUSer);
router.put('/updateusers/:userId', verifyToken, updateUser);
// router.get('/student/:studentId', verifyToken,  getStudentAttendance);
// router.get('/today', verifyToken,  getTodayAttendance);



module.exports = router