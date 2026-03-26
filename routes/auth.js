
const express = require('express');
const axios = require('axios');
const Model = require('../Models/models'); // Corrected import statement
// const RegisterModel = require('../Models/registeration'); // Corrected import statement
// const LoginModel = require('../Models/login'); // Corrected import statement
const router = express.Router();
const fs = require("fs");
const path = require("path");
const multer = require("multer");
const bcrypt = require('bcrypt');
const regUser = require('../Models/registeration');
const disputeData = require('../Models/dispute');
const {getallUsers, getAllStudentsInSchool, getUserByFilter, getAllStoreInSchool, getAllAgentsInSchool, getAllStudentsCountInSchool, getAllStoreInSchoolCount, getAllAgentsInSchoolCount, getuserbyid,getuser,getAllStudents, getallSchools, getMyChild,getallUsersInSchool, getallStudentsInSchool,getallAgentsInSchool, getallStoreInSchool, getallParents, getallStudentsInSchoolByAdmin, getallStoresInSchoolByAdmin, getallAgentsInStoreByAdmin, getallagents} = require('../Controllers/getAllusers');
const {getAllClassesWithCounts,getStudentCountByClass,login,getSchoolClasses, register,register2,logout,updateUser, forgotPassword,resetWithToken, deleteUser,deleteAllUsers, updatePassword, verifySenderAndReceiver, getSchoolById, deactiveUser,activateUSer, addBeneficiary, getBeneficiaries, removeBeneficiary, updateGuardian, getParent,getStudentsByBeneficiaryEmail, sendResetLink,uploadFileMiddleware, bulkRegister,batchUpdateAdmission } = require('../Controllers/userAuth');
const {requestAccountDeletion} = require('../Controllers/approval');
const verifyToken = require('./verifyToken');
const {uploadProfileImage,compressAndSaveProfilePicture} = require('../Middleware/upload');
const { updateUserProfilePicture, uploadZip } = require('../Controllers/userAuth');


// Register route
const storage = multer.memoryStorage();

const uploads = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
});

// ✅ Main upload route
// router.post('/upload-admissions',uploads.single('file'),batchUpdateAdmission);
const upload = multer({ dest: "uploads/" });
router.post("/upload-admission-number", verifyToken, uploads.single("file"), batchUpdateAdmission);
router.post("/upload-zip", upload.single("zipfile"), uploadZip);
router.post('/bulkregister',verifyToken, uploadFileMiddleware, bulkRegister)
router.post('/resetlink', sendResetLink);
router.post('/requestdelete/:id',verifyToken, requestAccountDeletion);
router.get('/getparents', verifyToken, getParent);
router.get('/getmychild', verifyToken, getStudentsByBeneficiaryEmail);
router.get('/getmychildren', verifyToken, getMyChild);
router.put('/updateguardian', verifyToken, updateGuardian);
router.post('/addbeneficiary/:id', verifyToken, addBeneficiary);
router.delete('/removebeneficiary/:id', verifyToken, removeBeneficiary);
router.get('/getbeneficiaries', verifyToken, getBeneficiaries);
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
router.get('/getallschooluser', verifyToken, getallUsersInSchool)
router.get('/getallschoolstudent', verifyToken, getallStudentsInSchool)
router.get('/getallschoolagent', verifyToken, getallAgentsInSchool)
router.get('/getallschoolstore', verifyToken, getallStoreInSchool)
router.get('/getallUsers', getallUsers);
router.get('/getallagent',verifyToken, getallagents);
router.get('/getclasscount',verifyToken, getStudentCountByClass);
router.get('/getuser/:id',verifyToken, getuserbyid);
router.get('/getuserone',verifyToken, getuser);
router.get('/getstudentbyid',verifyToken, getAllStudentsInSchool);
router.get('/getstudentbyidcount',verifyToken, getAllStudentsCountInSchool);
router.get('/getstudentinschoolbyadmin/:schoolId',verifyToken, getallStudentsInSchoolByAdmin);
router.get('/getstoreinschoolbyadmin/:schoolId',verifyToken, getallStoresInSchoolByAdmin);
router.get('/getagentinstorebyadmin/:storeId',verifyToken, getallAgentsInStoreByAdmin);
router.get('/getstorebyid',verifyToken, getAllStoreInSchool);
router.get('/getstorebyidcount',verifyToken, getAllStoreInSchoolCount);
router.get('/getagentbyid',verifyToken, getAllAgentsInSchool);
router.get('/getagentbyidcount',verifyToken, getAllAgentsInSchoolCount);
router.get('/getUserByFilter/:userid',verifyToken, getUserByFilter);
router.post('/forgotpassword', forgotPassword);
router.post('/reset-password/:token', resetWithToken);
router.post('/updatePassword', verifyToken, updatePassword);
router.delete('/delete/:id',verifyToken, deleteUser);
router.delete('/delete/all',verifyToken, deleteAllUsers);
router.delete('/verify-user', verifySenderAndReceiver);
router.get('/getschoolbyid/:id', getSchoolById);
router.get('/getallSchools',verifyToken, getallSchools);
// router.get('/getallstudents', getallSchools);
// router.get('/getallagent', getallSchools);
router.get('/getallparents',verifyToken, getallParents);
router.post('/upload-profile',verifyToken,uploadProfileImage, compressAndSaveProfilePicture, updateUserProfilePicture,
);



module.exports = router