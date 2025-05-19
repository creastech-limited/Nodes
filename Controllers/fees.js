const Fee = require('../Models/Fee');
const ClassUser = require('../Models/Class');

// Raise a fee using className
exports.raiseFeeForClass = async (req, res) => {
  try {
    const { className, schoolId, amount, description, term, session, feeType } = req.body;

    // Validate required fields
    if (!className || !schoolId || !amount || !term || !session || !feeType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Find the class by className and schoolId
    const classData = await ClassUser.findOne({ className, schoolId });

    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Create a fee entry
    const newFee = await Fee.create({
      classId: classData._id,
      className,
      schoolId,
      amount,
      description,
      term,
      session,
      feeType
    });

    res.status(201).json({
      message: 'Fee raised successfully',
      data: newFee
    });

  } catch (error) {
    console.error('Error raising fee:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
