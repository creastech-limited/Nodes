const express = require('express');
const axios = require('axios');
const Model = require('../Models/models'); // Corrected import statement
// const RegisterModel = require('../Models/registeration'); // Corrected import statement
// const LoginModel = require('../Models/login'); // Corrected import statement
const router = express.Router();
const verifyToken = require('./verifyToken');

const {createDispute} = require('../Controllers/dispute');
// const {getDisputeById, getDisputeByFilter, getAllDisputes} = require('../Controllers/getDispute');  



//create dispute
router.post('/createdispute',verifyToken, createDispute);
// router.get('/getDispute/:id',verifyToken, getDisputeById);



module.exports = router;
