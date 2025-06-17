const express = require('express');
const axios = require('axios');
const Model = require('../Models/models'); // Corrected import statement
// const RegisterModel = require('../Models/registeration'); // Corrected import statement
// const LoginModel = require('../Models/login'); // Corrected import statement
const router = express.Router();
const verifyToken = require('./verifyToken');

const {createDispute,getSchoolDisputes,getUserDisputes,updateDispute} = require('../Controllers/dispute');
// const {getDisputeById, getDisputeByFilter, getAllDisputes} = require('../Controllers/getDispute');  



//create dispute
router.post('/createdispute',verifyToken, createDispute);
//get all disputes
router.get('/getDispute',verifyToken, getSchoolDisputes);
//get dispute of a user
router.get('/getuserdispute', verifyToken, getUserDisputes);
//update dispute
router.put('/updatedispute/:id', verifyToken, updateDispute);
//delete dispute
// router.delete('/deletedispute/:id', verifyToken, deleteDispute);



module.exports = router;
