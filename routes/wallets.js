const express = require('express');
const axios = require('axios');
const Model = require('../Models/models'); // Corrected import statement
const Wallet = require('../Models/walletSchema'); // Corrected import statement
// const RegisterModel = require('../Models/registeration'); // Corrected import statement
// const LoginModel = require('../Models/login'); // Corrected import statement
const router = express.Router();
const {createSystemWallet, createChargesWallet} = require('../Controllers/initiateWalletController');
const {getOneWallet, deleteWallet, getWallet, deleteWalletsByFilter, getUserWallet} = require('../Controllers/getWallet');
const verifyToken = require('../routes/verifyToken');
const {transferFunds} = require('../Controllers/walletTransfers');



router.get('/getWallets',verifyToken, getWallet);
//create wallet for sytem Admin users
router.post('/createSystemWallet',verifyToken, createSystemWallet);
//create charges wallet for users
router.post('/createChargesWallet',verifyToken, createChargesWallet);
// delete wallet
router.delete('/deleteWallet/:walletId',verifyToken, deleteWallet);
// delete wallet by filter
router.delete('/deleteWallet',verifyToken, deleteWalletsByFilter);
// get one wallet
router.get('/getWallet/:userId',verifyToken, getOneWallet);
// get user wallet by id
router.get('/getuserwallet',verifyToken, getUserWallet);
//wallet to wallet transfer
router.post('/walletToWalletTransfer',verifyToken, transferFunds);

module.exports = router;