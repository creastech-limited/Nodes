const express = require('express');
const router = express.Router();
const {raiseFeeForClass,payFee,getFeeForStudent,getAllFees,deleteFee,getFeeById,deleteAllFeesForStudents, getFeesForSchool,getFeeForStudentById} = require('../Controllers/fees');
const verifyToken = require('./verifyToken');

router.post('/raise', verifyToken, raiseFeeForClass);//api/fees/raise
router.post('/pay', verifyToken, payFee); //api/fees/pay
router.delete('/delete/:id', verifyToken, deleteFee);  //api/fees/delete/:id
router.get('/getFeeForStudent/:email', verifyToken, getFeeForStudent);//api/fees/getFeeForStudent?studentId=123&schoolId=456
router.get('/getStudentFee', verifyToken, getFeeForStudentById);//api/fees/getFeeForStudent?studentId=123&schoolId=456
router.get('/getFeeById/:id', verifyToken, getFeeById);//api/fees/getFeeForStudent?studentId=123&schoolId=456
//get all fees
router.get('/getAllFees', verifyToken, getAllFees);//api/fees/getAllFees?schoolId=123
router.get('/getchoolFees', verifyToken, getFeesForSchool);//api/fees/getAllFees?schoolId=123
//delete fee for student
router.delete('/deletestudentfee', verifyToken, deleteAllFeesForStudents);//api/fees/deleteFee/:id







module.exports = router;