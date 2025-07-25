const express = require('express');
const router = express.Router();
const { initiateTransaction, verifyTransaction,verifyPinAndTransfer, reverseUnloggedTransaction,getAllTransactions, getTransactionById, updateTransferMetadata,deleteTransaction, verifyPinAndTransferToAgent} = require('../Controllers/transactionController');
const verifyToken = require('./verifyToken');
const { getBank, resolveAccountNumber, withdrawal, resolveAccount, reverseWithdrawal} = require('../Controllers/withdrawal');
// const {} = require('../Controllers/transactionController');

// Route to initiate a transaction
router.post('/initiateTransaction', verifyToken, initiateTransaction);
// Route to verify a transaction
router.post('/verifyTransaction/:reference', verifyTransaction);
// Route to get all transactions
router.get('/getAllTransactions', verifyToken, getAllTransactions);
// Route to get transaction by ID
router.get('/getusertransaction', verifyToken, getTransactionById);
// Route to verify sender and receiver
router.post('/transfer', verifyToken, verifyPinAndTransfer);
router.post('/transfertoagent', verifyToken, verifyPinAndTransferToAgent);
router.put('/updatetransaction',verifyToken, updateTransferMetadata);
router.delete('/dletetrans/:id',verifyToken, deleteTransaction);
router.get('/banks', getBank); // Route to get banks from Paystack
router.get('/resolve-account', resolveAccountNumber);
router.get('/resolveaccount', resolveAccount);
// Route to handle withdrawal
router.post('/withdraw', verifyToken, withdrawal);
// Route to reverse unlogged transaction
router.post('/reverseunloggedtransaction', reverseUnloggedTransaction);
//route to reverse withdrawal
router.post('/reversewithdrawal', verifyToken, reverseWithdrawal);

module.exports = router