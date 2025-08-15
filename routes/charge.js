const express = require('express');
const {createCharge, getCharges, updateCharge, deleteCharge} = require('../Controllers/charges');
const verifyToken = require('./verifyToken');
const router = express.Router();

router.post('/createCharge',verifyToken, createCharge); // Route to create a charge
router.get('/getAllCharges', getCharges); // Route to get all charges    
router.put('/updateCharge/:id',verifyToken, updateCharge); // Route to update a charge by ID
router.delete('/deleteCharge/:id',verifyToken, deleteCharge); // Route to delete a charge by ID



module.exports = router