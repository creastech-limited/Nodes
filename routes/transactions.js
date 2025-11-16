const express = require('express');
const router = express.Router();
const { initiateTransaction, verifyTransaction,verifyPinAndTransfer, reverseUnloggedTransaction,getAllTransactions, getTransactionById, updateTransferMetadata,deleteTransaction, getAllWithdrawalTransactions, getAllTopupTransactions, verifyPinAndTransferToAgent, setDefaultLimitForAllStudents, getAllLimits, deleteAllTransactionLimits, getLimitById, updateTransactionLimit, createPaystackDedicatedAccount,listPaystackDedicatedAccounts} = require('../Controllers/transactionController');
const verifyToken = require('./verifyToken');
const { getBank, resolveAccountNumber, withdrawal, resolveAccount, reverseWithdrawal,validateWithdrawal } = require('../Controllers/withdrawal');
// const {} = require('../Controllers/transactionController');



// Route to get all withdrawal transactions
router.get('/getAllWithdrawalTransactions', verifyToken, getAllWithdrawalTransactions);
// Route to get all withdrawal transactions
router.get('/getAllTopupTransactions', verifyToken, getAllTopupTransactions);
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
router.post('/validateaccount', verifyToken, validateWithdrawal);
router.post('/setdefaultlimit', verifyToken, setDefaultLimitForAllStudents);
router.get('/getalllimits', verifyToken, getAllLimits);
router.delete('/deletealltransactionlimits', verifyToken, deleteAllTransactionLimits);
router.get('/getlimitbyid/:studentId', verifyToken, getLimitById);
router.put('/updatetransactionlimit/:studentId', verifyToken, updateTransactionLimit);
router.post('/createpaystackdedicatedaccount', verifyToken, createPaystackDedicatedAccount);
router.get('/listpaystackdedicatedaccounts', verifyToken, listPaystackDedicatedAccounts);

module.exports = router