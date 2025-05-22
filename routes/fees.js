const express = require('express');
const router = express.Router();
const {raiseFeeForClass,getFeeForStudent,getAllFees,deleteFee,getFeeById} = require('../Controllers/fees');
const verifyToken = require('./verifyToken');

router.post('/raise', verifyToken, raiseFeeForClass);
router.delete('/delete/:id', verifyToken, deleteFee);  //api/fees/delete/:id
router.get('/getFeeForStudent', verifyToken, getFeeForStudent);//api/fees/getFeeForStudent?studentId=123&schoolId=456
router.get('/getFeeById/:id', verifyToken, getFeeById);//api/fees/getFeeForStudent?studentId=123&schoolId=456
//get all fees
router.get('/getAllFees', verifyToken, getAllFees);//api/fees/getAllFees?schoolId=123





module.exports = router;