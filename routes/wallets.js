const express = require('express');
const axios = require('axios');
const Model = require('../Models/models'); // Corrected import statement
const Wallet = require('../Models/walletSchema'); // Corrected import statement
// const RegisterModel = require('../Models/registeration'); // Corrected import statement
// const LoginModel = require('../Models/login'); // Corrected import statement
const router = express.Router();
const {createSystemWallet, createChargesWallet,deleteWallet, getChargesWallets,updateChargesWallet} = require('../Controllers/initiateWalletController');
const {getOneWallet, getWallet, deleteWalletsByFilter, getUserWallet,
    //deleteSystemWallet
} = require('../Controllers/getWallet');
const verifyToken = require('../routes/verifyToken');
const {transferFunds} = require('../Controllers/walletTransfers');



router.get('/getWallets', getWallet);
//create wallet for sytem Admin users
router.post('/createSystemWallet',verifyToken, createSystemWallet);
//create charges wallet for users
router.post('/createChargesWallet',verifyToken, createChargesWallet);
//delete charges wallet for WalletId
// router.delete('/deleteChargesWallet',verifyToken, deleteSystemWallet);
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
router.get('/getChargesWallets',verifyToken, getChargesWallets);
//update charges wallet
router.put('/updateChargesWallet/:walletId',verifyToken, updateChargesWallet);

module.exports = router;