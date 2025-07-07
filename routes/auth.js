
const express = require('express');
const axios = require('axios');
const Model = require('../Models/models'); // Corrected import statement
// const RegisterModel = require('../Models/registeration'); // Corrected import statement
// const LoginModel = require('../Models/login'); // Corrected import statement
const router = express.Router();
const bcrypt = require('bcrypt');
const regUser = require('../Models/registeration');
const disputeData = require('../Models/dispute');
const {getallUsers, getAllStudentsInSchool, getUserByFilter, getAllStoreInSchool, getAllAgentsInSchool, getAllStudentsCountInSchool, getAllStoreInSchoolCount, getAllAgentsInSchoolCount, getuserbyid,getuser,getAllStudents, getallSchools} = require('../Controllers/getAllusers');
const {getAllClassesWithCounts,getStudentCountByClass,login,getSchoolClasses, register,register2,logout,updateUser, forgotPassword,resetWithToken, deleteUser,deleteAllUsers, updatePassword, verifySenderAndReceiver, getSchoolById, deactiveUser,activateUSer} = require('../Controllers/userAuth');
const { initiateTransaction, verifyTransaction} = require('../Controllers/transactionController');
const verifyToken = require('./verifyToken');
const {uploadProfileImage,compressAndSaveProfilePicture} = require('../Middleware/upload');
const { updateUserProfilePicture } = require('../Controllers/userAuth');


// Register route
router.put('/deactive/:id', verifyToken, deactiveUser);
router.put('/active/:id', verifyToken, activateUSer);
router.post('/register', register);
router.post('/register1', register2);
router.post('/login', login);
router.post('/logout',verifyToken, logout);
router.put('/update-user/:id', verifyToken, updateUser);
router.get('/getclasse', verifyToken, getSchoolClasses)
router.get('/getallclasseswithcount', verifyToken, getAllClassesWithCounts)
router.get('/getallsudent', verifyToken, getAllStudents)
router.get('/getallUsers', getallUsers);
router.get('/getclasscount',verifyToken, getStudentCountByClass);
router.get('/getuser/:id',verifyToken, getuserbyid);
router.get('/getuserone',verifyToken, getuser);
router.get('/getstudentbyid',verifyToken, getAllStudentsInSchool);
router.get('/getstudentbyidcount',verifyToken, getAllStudentsCountInSchool);
router.get('/getstorebyid',verifyToken, getAllStoreInSchool);
router.get('/getstorebyidcount',verifyToken, getAllStoreInSchoolCount);
router.get('/getagentbyid',verifyToken, getAllAgentsInSchool);
router.get('/getagentbyidcount',verifyToken, getAllAgentsInSchoolCount);
router.get('/getUserByFilter/:userid',verifyToken, getUserByFilter);
router.post('/forgotpasword', forgotPassword);
router.post('/reset-password/:token', resetWithToken);
router.post('/updatePassword', verifyToken, updatePassword);
router.delete('/delete/:id', deleteUser);
router.delete('/delete', deleteAllUsers);
router.delete('/verify-user', verifySenderAndReceiver);
router.get('/getschoolbyid/:id', getSchoolById);
router.get('/getallSchools', getallSchools);
router.post('/upload-profile',verifyToken,uploadProfileImage, compressAndSaveProfilePicture, updateUserProfilePicture, 
);



module.exports = router