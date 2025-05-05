const express = require('express');
const router = express.Router();
const { initiateTransaction, verifyTransaction,getAllTransactions, getTransactionById} = require('../Controllers/transactionController');
const verifyToken = require('./verifyToken');

// Route to initiate a transaction
router.post('/initiateTransaction', verifyToken, initiateTransaction);
// Route to verify a transaction
router.post('/verifyTransaction/:reference', verifyTransaction);
// Route to get all transactions
router.get('/getAllTransactions', verifyToken, getAllTransactions);
// Route to get transaction by ID
router.get('/getusertransaction', verifyToken, getTransactionById);


module.exports = router