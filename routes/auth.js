

const express = require('express');
const axios = require('axios');
const Model = require('../Models/models'); // Corrected import statement
// const RegisterModel = require('../Models/registeration'); // Corrected import statement
// const LoginModel = require('../Models/login'); // Corrected import statement
const router = express.Router();
const bcrypt = require('bcrypt');
const regUser = require('../Models/registeration');
const disputeData = require('../Models/dispute');
const {getallUsers, getAllStudentsInSchool, getUserByFilter, getAllStoreInSchool, getAllAgentsInSchool, getAllStudentsCountInSchool, getAllStoreInSchoolCount, getAllAgentsInSchoolCount, getuserbyid,getuser} = require('../Controllers/getAllusers');
const {login, register,logout,updateUser, forgotPassword,resetWithToken, deleteUser,deleteAllUsers} = require('../Controllers/userAuth');
const { initiateTransaction, verifyTransaction} = require('../Controllers/transactionController');
const verifyToken = require('./verifyToken');


// Register route
router.post('/register', register);
router.post('/login', login);
router.post('/logout',verifyToken, logout);
router.put('/update-user/:id', verifyToken, updateUser)
router.get('/getallUsers',verifyToken, getallUsers);
router.get('/getuser/:id', getuserbyid);
router.get('/getuserone',verifyToken, getuser);
router.get('/getstudentbyid',verifyToken, getAllStudentsInSchool);
router.get('/getstudentbyidcount',verifyToken, getAllStudentsCountInSchool);
router.get('/getstorebyid',verifyToken, getAllStoreInSchool);
router.get('/getstorebyidcount',verifyToken, getAllStoreInSchoolCount);
router.get('/getagentbyid',verifyToken, getAllAgentsInSchool);
router.get('/getagentbyidcount',verifyToken, getAllAgentsInSchoolCount);
router.get('/getUserByFilter/:userid',verifyToken, getUserByFilter);
router.post('/forgotpaswoord', forgotPassword);
router.post('/reset-password/:token', resetWithToken);
router.delete('/delete/:id', deleteUser);
router.delete('/delete', deleteAllUsers);


module.exports = router