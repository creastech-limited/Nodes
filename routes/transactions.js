const express = require('express');
const router = express.Router();
const { initiateTransaction, verifyTransaction,verifyPinAndTransfer, getAllTransactions, getTransactionById, updateTransferMetadata,deleteTransaction} = require('../Controllers/transactionController');
const verifyToken = require('./verifyToken');
const { getBank, resolveAccountNumber, withdrawal} = require('../Controllers/withdrawal');
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
router.put('/updatetransaction',verifyToken, updateTransferMetadata);
router.delete('/dletetrans/:id',verifyToken, deleteTransaction);
router.get('/banks', verifyToken, getBank); // Route to get banks from Paystack
router.get('/resolve-account', verifyToken, resolveAccountNumber);
// Route to handle withdrawal
router.post('/withdrawal', verifyToken, withdrawal);

module.exports = router