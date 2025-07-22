const Charge = require('../Models/charges');
const mongoose = require('mongoose');

// Function to create a new charge
exports.createCharge = async (req, res) => {
    const { name, chargeType, amount, description } = req.body;
    if (!name || !chargeType || amount === undefined) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    if (chargeType !== 'Flat' && chargeType !== 'Percentage') {
        return res.status(400).json({ message: 'Invalid charge type' });
    }
    try {
        const charge = new Charge({
            name,
            chargeType,
            amount,
            description,
            createdBy: req.user.id
        });
        await charge.save();
        res.status(201).json({ message: 'Charge created successfully', charge });
    } catch (error) {
        console.error("Error creating charge:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
    }

    // Function to get all charges
exports.getCharges = async (req, res) => {
    try {
        const charges = await Charge.find().sort({ createdAt: -1 });
        res.status(200).json(charges);
    } catch (error) {
        console.error("Error fetching charges:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
    }
//update charge
exports.updateCharge = async (req, res) => {
    const { id } = req.params;
    const { name, chargeType, amount, description } = req.body;

    if (!name || !chargeType || amount === undefined) {
        return res.status(400).json({ message: 'All fields are required' });
    }
    if (chargeType !== 'Flat' && chargeType !== 'Percentage') {
        return res.status(400).json({ message: 'Invalid charge type' });
    }

    try {
        const charge = await Charge.findByIdAndUpdate(id, {
            name,
            chargeType,
            amount,
            description
        }, { new: true });

        if (!charge) {
            return res.status(404).json({ message: 'Charge not found' });
        }

        res.status(200).json({ message: 'Charge updated successfully', charge });
    } catch (error) {
        console.error("Error updating charge:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}
// Function to delete a charge
exports.deleteCharge = async (req, res) => {
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid charge ID' });
    }

    try {
        const charge = await Charge.findByIdAndDelete(id);

        if (!charge) {
            return res.status(404).json({ message: 'Charge not found' });
        }

        res.status(200).json({ message: 'Charge deleted successfully', charge });
    } catch (error) {
        console.error("Error deleting charge:", error);
        res.status(500).json({ message: 'Server error', error: error.message });
    }
}   