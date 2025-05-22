const Fee = require('../Models/fees');
const {ClassUser, regUser} = require('../Models/registeration');
const Notification = require('../Models/notification');
const sendEmail = require('../utils/email');
const Wallet = require('../Models/walletSchema');
const Transaction = require('../Models/transactionSchema');



// Raise a fee using className
exports.raiseFeeForClass = async (req, res) => {
  const currentUserId = req.user?.id;
  const user = await regUser.findById(currentUserId);
  const schoolId = user?._id;

  if (!schoolId) {
    return res.status(400).json({ message: 'School ID not found' });
  }

  const { className, amount, description, term, session, feeType, dueDate } = req.body;

  if (!className || !amount || !term || !session || !feeType || !dueDate) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    const classData = await ClassUser.findOne({ className, schoolId });
    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }
    const classId = classData._id.toString();
    console.log('Class Data:', classId); // Log the class data for debugging
    // Get all students in the class
    const students = await regUser.find({ Class: classData._id.toString(), role: 'student' });
    console.log('Students:', students.length); // Log the students for debugging
    

    let createdFees = [];
    for (const student of students) {
      // Check if fee already exists for this student
      const existing = await Fee.findOne({
        studentId: student._id,
        classId: classData._id,
        term,
        session,
        feeType,
      });

      if (existing) continue;

      // Create fee record
      const newFee = await Fee.create({
        studentId: student._id,
        studentName: student.fullName,
        classId: classData._id,
        className,
        schoolId,
        amount,
        description,
        term,
        session,
        feeType,
        dueDate,
        createdBy: currentUserId,
        status: 'Pending',
      });

      // Push notification
      await Notification.create({
        userId: student._id,
        title: 'New Fee Assigned',
        message: `A new fee of ₦${amount} has been assigned for ${term} ${session}.`,
        read: false,
      });

      // Send email
   try {
        const emailResponse =   await sendEmail({
        to: student.email,
        subject: 'New Fee Notification',
        html: `
          <p>Hello ${student.name},</p>
          <p>You have a new fee of <strong>₦${amount}</strong> for <strong>${feeType}</strong>.</p>
          <p>Term: ${term} | Session: ${session} | Due: ${dueDate}</p>
          <p>Please log in to your portal to view details.</p>
        `,
      });

  console.log("Email sent successfully:");
} catch (error) {
  console.error("Failed to send login email:", error.message);
}

      // Optional: log transaction
     // Get student's wallet
const studentWallet = await Wallet.findOne({ userId: student._id });

if (studentWallet) {
  const currentBalance = studentWallet.balance || 0;

  await Transaction.create({
    senderWalletId: schoolId,
    receiverWalletId: studentWallet._id, // If needed
    transactionType: 'school_fee_allocation',
    category: 'internal',
    amount,
    balanceBefore: currentBalance,
    balanceAfter: currentBalance, // No deduction
    reference: `FEE-${student._id}-${Date.now()}`, // Unique per transaction
    description: `Fee of ₦${amount} allocated to ${student.fullName} for ${feeType}, ${term}, ${session}`,
    status: 'success',
    metadata: {
      studentId: student._id,
      classId: classData._id,
      className,
      feeType,
      term,
      session,
      dueDate
    }
  });
} else {
  console.warn(`No wallet found for student ${student.fullName} (${student._id})`);
}


      createdFees.push(newFee);
    }

    res.status(201).json({
      message: `${createdFees.length} fee(s) raised successfully.`,
      data: createdFees,
    });
  } catch (error) {
    console.error('Error raising fee:', error);
    res.status(500).json({ message: error.message });
  }
};

// Get all fees
exports.getAllFees = async (req, res) => {
  try {
    const fees = await Fee.find();
    res.status(200).json({
      message: 'Fees retrieved successfully',
      data: fees
    });
  } catch (error) {
    console.error('Error retrieving fees:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get fee by ID
exports.getFeeById = async (req, res) => {
  try {
    const feeId = req.params.id;
    console.log('Fee ID:', feeId); // Log the feeId for debugging
    const fee = await Fee.findById(feeId);
    if (!fee) {
      return res.status(404).json({ message: 'Fee not found' });
    } 
    res.status(200).json({
      message: 'Fee retrieved successfully',
      data: fee
    });
  }
  catch (error) {
    console.error('Error retrieving fee:', error);
    res.status(500).json({ message: 'Server error' });
  }
}
// Update fee
exports.updateFee = async (req, res) => {
  try {
    const feeId = req.params.id;
    const { amount, description, term, session, feeType } = req.body;

    // Validate required fields
    if (!amount || !term || !session || !feeType) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Find and update the fee
    const updatedFee = await Fee.findByIdAndUpdate(feeId, {
      amount,
      description,
      term,
      session,
      feeType
    }, { new: true });

    if (!updatedFee) {
      return res.status(404).json({ message: 'Fee not found' });
    }

    res.status(200).json({
      message: 'Fee updated successfully',
      data: updatedFee
    });
  } catch (error) {
    console.error('Error updating fee:', error);
    res.status(500).json({ message: 'Server error' });
  }
};  
// Delete fee
exports.deleteFee = async (req, res) => {
  try {
    const feeId = req.params.id;
    const deletedFee = await Fee.findByIdAndDelete(feeId);
    if (!deletedFee) {
      return res.status(404).json({ message: 'Fee not found' });
    }
    res.status(200).json({
      message: 'Fee deleted successfully',
      data: deletedFee
    });
  } catch (error) {
    console.error('Error deleting fee:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
// Get all fees for a specific class
exports.getFeesForClass = async (req, res) => {
  try {
    const { className, schoolId } = req.params;

    // Validate required fields
    if (!className || !schoolId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Find the class by className and schoolId
    const classData = await ClassUser.findOne({ className, schoolId });

    if (!classData) {
      return res.status(404).json({ message: 'Class not found' });
    }

    // Find fees for the class
    const fees = await Fee.find({ classId: classData._id });

    res.status(200).json({
      message: 'Fees retrieved successfully',
      data: fees
    });
  } catch (error) {
    console.error('Error retrieving fees for class:', error); 
    res.status(500).json({ message: 'Server error' });
  }
}
// Get all fees for a specific school
exports.getFeesForSchool = async (req, res) => {
  try {
    const { schoolId } = req.params;

    // Validate required fields
    if (!schoolId) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Find fees for the school
    const fees = await Fee.find({ schoolId });

    res.status(200).json({
      message: 'Fees retrieved successfully',
      data: fees
    });
  } catch (error) {
    console.error('Error retrieving fees for school:', error);
    res.status(500).json({ message: 'Server error' });
  }
} 

//get fee for a student
exports.getFeeForStudent = async (req, res) => {
  const currentUserId = req.user?.id;

  try {
    const user = await regUser.findById(currentUserId);
    const userRole = user?.role;

    // Validate role
    if (userRole !== 'parent' && userRole !== 'student' && userRole !== 'school') {
      return res.status(403).json({ message: 'Access denied. Only students, parents, or schools can view fees.' });
    }

    const { studentEmail } = req.body;

    // Validate input
    if (!studentEmail) {
      return res.status(400).json({ message: 'Missing required fields: studentEmail' });
    }

    // Find student by email
    const student = await regUser.findOne({ email: studentEmail });
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const studentId = student._id;

    // Find fees for student
    const fees = await Fee.find({ studentId });

    if (fees.length === 0) {
      return res.status(200).json({ message: 'No fees found for this student', data: [] });
    }

    res.status(200).json({
      message: 'Fees retrieved successfully',
      data: fees
    });
  } catch (error) {
    console.error('Error retrieving fees for student:', error);
    res.status(500).json({ message: 'Server error' });
  }
};
