const {Fee, FeePayment} = require('../Models/fees');
const {ClassUser, regUser} = require('../Models/registeration');
const Notification = require('../Models/notification');
const sendEmail = require('../utils/email');
const Wallet = require('../Models/walletSchema');
const Transaction = require('../Models/transactionSchema');
const { v4: uuidv4 } = require('uuid');
const { generateReference } = require('../utils/generatereference'); // You can define your own unique ref generator



// Raise a fee using className

exports.raiseFeeForClass = async (req, res) => {
  const currentUserId = req.user?.id;
  const user = await regUser.findById(currentUserId);
  const schoolId = user?._id;
  console.log('School ID:', schoolId); // Log the schoolId for debugging
  console.log('Current User ID:', currentUserId); // Log the currentUserId for debugging


  if (!schoolId) return res.status(400).json({ message: 'School ID not found' });

  const { className, amount, description, term, session, feeType, dueDate } = req.body;

  if (!className || !amount || !term || !session || !feeType || !dueDate) {
    return res.status(400).json({ message: 'Missing required fields' });
  }

  try {
    // Get class info
    const classData = await ClassUser.findOne({ className, schoolId });
    if (!classData) return res.status(404).json({ message: 'Class not found' });

    //
    // Check if fee already exists for this class, term, and session
    const existingFee = await Fee.findOne({ classId: classData._id.toString(), term, session, feeType });
    if (existingFee) return res.status(409).json({ message: 'Fee already exists for this class, term, and session.'+existingFee._id });

    // Create the class-wide fee record
    const newFee = await Fee.create({
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
      status: 'Active'
    });

    // Get students in the class
    const students = await regUser.find({ Class: classData._id.toString(), role: 'student' });
    console.log('Students:', students.length); // Log the students for debugging
    if (students.length === 0) {
      return res.status(404).json({ message: 'No students found for this class.' });
    }

    const schoolWallet = await Wallet.findOne({ userId: schoolId });

    // Prepare batched operations
    const feeStatusList = [];
    const transactionList = [];
    const notificationList = [];
    const emailPromises = [];

    for (const student of students) {
      try {
        const timestamp = Date.now();
        const reference = `FEE-${student._id}-${timestamp}`;
        const studentWallet = await Wallet.findOne({ userId: student._id });
        if (!studentWallet) {
          console.warn(`No wallet found for student ${student.fullName} (${student._id})`);
          continue; // Skip this student if no wallet is found
        }
        console.log("studentId", student._id);
        console.log("feeId", newFee._id);
      

        // Create fee status
        feeStatusList.push({
          studentId: student._id,
          feeId: newFee._id,
          schoolId,
          amount,
          feeType,
          term,
          session,
          className,
          status: 'Unpaid',
          amountPaid: 0,
          paymentMethod: 'none',
          transactionId: reference
        });

        // Log transaction if wallet found
        if (studentWallet) {
          const currentBalance = studentWallet.balance || 0;

          transactionList.push({
            senderWalletId: schoolWallet?._id || null,
            receiverWalletId: studentWallet._id,
            transactionType: 'school_fee_allocation',
            category: 'internal',
            amount,
            balanceBefore: currentBalance,
            balanceAfter: currentBalance,
            reference,
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

        // Notification
        notificationList.push({
          userId: student._id,
          title: 'New Fee Assigned',
          message: `A new fee of ₦${amount} has been assigned for ${term} ${session}.`,
          read: false
        });

        // Email
        emailPromises.push(sendEmail({
          to: [student.email, 'taiwodavid19@gmail.com'],
          subject: 'New Fee Notification',
          html: `
            <p>Hello ${student.name},</p>
            <p>You have a new fee of <strong>₦${amount}</strong> for <strong>${feeType}</strong>.</p>
            <p>Term: ${term} | Session: ${session} | Due: ${dueDate}</p>
            <p>Please log in to your portal to view details.</p>
          `
        }));
      } catch (studentErr) {
        console.error(`Error processing student ${student._id}:`, studentErr);
      }
    }

    // Execute batched inserts
    await Promise.all([
      FeePayment.insertMany(feeStatusList),
      Transaction.insertMany(transactionList),
      Notification.insertMany(notificationList),
      ...emailPromises
    ]);

    res.status(201).json({ message: 'Fee raised successfully.', data: newFee });
  } catch (err) {
    console.error('Error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

// exports.raiseFeeForClass = async (req, res) => {
//   const currentUserId = req.user?.id;
//   const user = await regUser.findById(currentUserId);
//   const schoolId = user?._id;

//   if (!schoolId) {
//     return res.status(400).json({ message: 'School ID not found' });
//   }

//   const { className, amount, description, term, session, feeType, dueDate } = req.body;

//   if (!className || !amount || !term || !session || !feeType || !dueDate) {
//     return res.status(400).json({ message: 'Missing required fields' });
//   }

//   try {
//     const classData = await ClassUser.findOne({ className, schoolId });
//     if (!classData) {
//       return res.status(404).json({ message: 'Class not found' });
//     }
//     const classId = classData._id.toString();
//     console.log('Class Data:', classId); // Log the class data for debugging
//     // Get all students in the class
//     const students = await regUser.find({ Class: classData._id.toString(), role: 'student' });
//     console.log('Students:', students.length); // Log the students for debugging
    

//     let createdFees = [];
//     for (const student of students) {
//       // Check if fee already exists for this student
//       const existing = await Fee.findOne({
//         studentId: student._id,
//         classId: classData._id,
//         term,
//         session,
//         feeType,
//       });

//       if (existing) continue;

//       // Create fee record
//       const newFee = await Fee.create({
//         studentId: student._id,
//         studentName: student.fullName,
//         classId: classData._id,
//         className,
//         schoolId,
//         amount,
//         description,
//         term,
//         session,
//         feeType,
//         dueDate,
//         createdBy: currentUserId,
//         status: 'Pending',
//       });

//       // Push notification
//       await Notification.create({
//         userId: student._id,
//         title: 'New Fee Assigned',
//         message: `A new fee of ₦${amount} has been assigned for ${term} ${session}.`,
//         read: false,
//       });

//       // Send email
//    try {
//         const emailResponse =   await sendEmail({
//         to: student.email,
//         subject: 'New Fee Notification',
//         html: `
//           <p>Hello ${student.name},</p>
//           <p>You have a new fee of <strong>₦${amount}</strong> for <strong>${feeType}</strong>.</p>
//           <p>Term: ${term} | Session: ${session} | Due: ${dueDate}</p>
//           <p>Please log in to your portal to view details.</p>
//         `,
//       });

//   console.log("Email sent successfully:");
// } catch (error) {
//   console.error("Failed to send login email:", error.message);
// }

//       // Optional: log transaction
//      // Get student's wallet
// const studentWallet = await Wallet.findOne({ userId: student._id });

// if (studentWallet) {
//   const currentBalance = studentWallet.balance || 0;

//   await Transaction.create({
//     senderWalletId: schoolId,
//     receiverWalletId: studentWallet._id, // If needed
//     transactionType: 'school_fee_allocation',
//     category: 'internal',
//     amount,
//     balanceBefore: currentBalance,
//     balanceAfter: currentBalance, // No deduction
//     reference: `FEE-${student._id}-${Date.now()}`, // Unique per transaction
//     description: `Fee of ₦${amount} allocated to ${student.fullName} for ${feeType}, ${term}, ${session}`,
//     status: 'success',
//     metadata: {
//       studentId: student._id,
//       classId: classData._id,
//       className,
//       feeType,
//       term,
//       session,
//       dueDate
//     }
//   });
// } else {
//   console.warn(`No wallet found for student ${student.fullName} (${student._id})`);
// }


//       createdFees.push(newFee);
//     }

//     res.status(201).json({
//       message: `${createdFees.length} fee(s) raised successfully.`,
//       data: createdFees,
//     });
//   } catch (error) {
//     console.error('Error raising fee:', error);
//     res.status(500).json({ message: error.message });
//   }
// };
// exports.raiseFeeForClass = async (req, res) => {
//   const currentUserId = req.user?.id;
//   const user = await regUser.findById(currentUserId);
//   const schoolId = user?._id;

//   if (!schoolId) return res.status(400).json({ message: 'School ID not found' });

//   const { className, amount, description, term, session, feeType, dueDate } = req.body;

//   if (!className || !amount || !term || !session || !feeType || !dueDate) {
//     return res.status(400).json({ message: 'Missing required fields' });
//   }

//   try {
//     const classData = await ClassUser.findOne({ className, schoolId });
//     if (!classData) return res.status(404).json({ message: 'Class not found' });

//     // Prevent duplicates
//     const existingFee = await Fee.findOne({ 
//       classId: classData._id, 
//       term, 
//       session, 
//       feeType 
//     });

//     if (existingFee) return res.status(409).json({ message: 'Fee already exists for this class, term, and session.' });

//     // Create class-level fee
//     const newFee = await Fee.create({
//       classId: classData._id,
//       className,
//       schoolId,
//       amount,
//       description,
//       term,
//       session,
//       feeType,
//       dueDate,
//       createdBy: currentUserId,
//       status: 'Pending'
//     });

//     // Optionally notify students
//     const students = await regUser.find({ classId: classData._id, role: 'student' });
//     if (students.length === 0) {
//       return res.status(404).json({ message: 'No students found for this class.' });
//     }
//     for (const student of students) {
//       await FeeStatus.create({ 
//           studentId: student._id,
//           feeId: newFee._id,
//           status: 'unpaid',
//           amountPaid: 0,
//           paymentMethod: 'none',
//           transactionId: `FEE-${student._id}-${Date.now()}`, // Unique transaction ID
//         });
//       //log transaction
//       const studentWallet = await Wallet.findOne({ userId: student._id });
//       if (studentWallet) {
//         const currentBalance = studentWallet.balance || 0;

//         await Transaction.create({
//           senderWalletId: schoolId,
//           receiverWalletId: studentWallet._id,
//           transactionType: 'school_fee_allocation',
//           category: 'internal',
//           amount,
//           balanceBefore: currentBalance,
//           balanceAfter: currentBalance, // No deduction
//           reference: `FEE-${student._id}-${Date.now()}`, // Unique per transaction
//           description: `Fee of ₦${amount} allocated to ${student.fullName} for ${feeType}, ${term}, ${session}`,
//           status: 'success',
//           metadata: {
//             studentId: student._id,
//             classId: classData._id,
//             className,
//             feeType,
//             term,
//             session,
//             dueDate
//           }
//         });
//       } else {
//         console.warn(`No wallet found for student ${student.fullName} (${student._id})`);
//       }

//       // Notification, email, etc.
//       await Notification.create({
//         userId: student._id,
//         title: 'New Fee Assigned',
//         message: `A new fee of ₦${amount} has been assigned for ${term} ${session}.`,
//         read: false
//       });
//       await sendEmail({
//         to: [student.email,'taiwodavid19@gmail.com'],
//         subject: 'New Fee Notification',
//         html: `
//           <p>Hello ${student.fullName},</p>
//           <p>You have a new fee of <strong>₦${amount}</strong> for <strong>${feeType}</strong>.</p>
//           <p>Term: ${term} | Session: ${session} | Due: ${dueDate}</p>
//           <p>Please log in to your portal to view details.</p>
//         `
//       });
//     }

//     res.status(201).json({ message: 'Fee raised successfully.', data: newFee });
//   } catch (err) {
//     console.error('Error:', err);
//     res.status(500).json({ message: 'Server error' });
//   }
// };


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
//delete all fees for students
exports.deleteAllFeesForStudents = async (req, res) => {
  try {
    const { email } = req.body;
    const student = await regUser.findOne({ email });
    console.log('Student:', student._id); // Log the student for debugging  
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    // Validate required fields
    console.log('Student ID:', student._id); // Log the studentId for debugging
    // Delete all fees for the student
    const deletedFees = await FeePayment.deleteMany({ studentId: student._id });

    if (deletedFees.deletedCount === 0) {
      return res.status(404).json({ message: 'No fees found for this student' });
    }

    res.status(200).json({
      message: 'All fees deleted successfully',
      data: deletedFees
    });
  } catch (error) {
    console.error('Error deleting fees for student:', error);
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
    const currentUserId = req.user?.id;
    const user = await regUser.findById(currentUserId);

    // Validate required fields
    if (!user) {
      return res.status(400).json({ message: 'Missing required fields' });
    }
    const schoolId = user._id;

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

    const  {email} = req.params;
    console.log(email)

    // Validate input
    if (!email) {
      return res.status(400).json({ message: 'Missing required fields: studentEmail' });
    }

    // Find student by email
    const student = await regUser.findOne({ email: email});
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    const studentId = student._id;
    console.log('Student ID:', studentId); // Log the studentId for debugging

    // Find fees for student
    const fees = await FeePayment.find({ studentId });

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
//get fee for a student by ID
exports.getFeeForStudentById = async (req, res) => {
  const currentUserId = req.user?.id;

  try {
    const user = await regUser.findById(currentUserId);
    const userRole = user?.role;

    // Validate role
    if (userRole !== 'student') {
      return res.status(403).json({ message: 'Access denied. Only students, parents, or schools can view fees.' });
    }

    const studentId = user._id;

    // Validate input
    if (!studentId) {
      return res.status(400).json({ message: 'Missing required fields: studentId' });
    }

    // Find student by ID
    const student = await regUser.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Find fees for student
    const fees = await FeePayment.find({ studentId });

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
}



exports.payFee = async (req, res) => {
  const user = req.user?.id;
  const { feeId, amount,  studentEmail} = req.body;
  const student = await regUser.findOne({email: studentEmail});
  const studentId = student?._id;

  const failTransaction = async (reason, fee = null, student = student, studentWallet = null, receiverWallet = null) => {
    try {
      const reference = generateReference('FEE_FAIL');

      await Transaction.create({
        senderWalletId: studentWallet?._id || null,
        receiverWalletId: receiverWallet?._id || null,
        transactionType: 'fee_payment',
        category: 'debit',
        amount,
        balanceBefore: studentWallet?.balance || 0,
        balanceAfter: studentWallet?.balance || 0,
        reference,
        description: `Failed fee payment of ₦${amount}${student?.name ? ' for ' + student.name : ''}${fee ? ` (${fee.feeType}, ${fee.term}, ${fee.session})` : ''} - Reason: ${reason}`,
        status: 'failed',
        metadata: {
          studentId: student?._id,
          feeId: fee?._id,
          reason,
        },
      });
    } catch (err) {
      console.error('Error saving failed transaction:', err.message);
    }
  };

  if (!feeId || !amount) {
    return res.status(400).json({ message: 'Fee ID and amount are required' });
  }

  try {
    const fee = await Fee.findById(feeId);
    if (!fee) {
      await failTransaction('Fee not found');
      return res.status(404).json({ message: 'Fee not found' });
    }

    const feeStatus = await FeePayment.findOne({ studentId, feeId });
    if (!feeStatus) {
      await failTransaction('Fee not assigned to this student', fee);
      return res.status(404).json({ message: 'Fee not assigned to this student' });
    }

    const student = await regUser.findById(studentId);
    const studentWallet = await Wallet.findOne({ userId: studentId });
    if (!studentWallet) {
      await failTransaction('Student wallet not found', fee, student);
      return res.status(404).json({ message: 'Student wallet not found' });
    }

    const schoolUser = await regUser.findOne({ schoolId: student.schoolId, role: 'school' });
    const receiverWallet = schoolUser
      ? await Wallet.findOne({ userId: schoolUser._id })
      : null;

    if (!receiverWallet) {
      await failTransaction('School wallet not found', fee, student, studentWallet);
      return res.status(404).json({ message: 'School wallet not found' });
    }

    if (studentWallet.balance < amount) {
      await failTransaction('Insufficient balance', fee, student, studentWallet, receiverWallet);
      return res.status(400).json({ message: 'Insufficient balance' });
    }

    // Deduct student wallet
    const balanceBefore = studentWallet.balance;
    studentWallet.balance -= amount;
    const balanceAfter = studentWallet.balance;
    await studentWallet.save();

    // Credit school wallet
    receiverWallet.balance += amount;
    await receiverWallet.save();

    // Update fee status
    FeePayment.amountPaid += amount;
    if (FeePayment.amountPaid >= fee.amount) {
      FeePayment.status = 'paid';
    } else if (FeePayment.amountPaid > 0) {
      FeePayment.status = 'partial';
    }
    await FeePayment.save();

    // Log success transaction
    await Transaction.create({
      senderWalletId: studentWallet._id,
      receiverWalletId: receiverWallet._id,
      transactionType: 'fee_payment',
      category: 'debit',
      amount,
      balanceBefore,
      balanceAfter,
      reference: generateReference('FEE'),
      description: `Fee payment for ${fee.feeType} (${fee.term}, ${fee.session})`,
      status: 'success',
      metadata: {
        studentId,
        schoolId: student.schoolId,
        feeType: fee.feeType,
        term: fee.term,
        session: fee.session,
        amountPaid: FeePayment.amountPaid,
        paymentMethod: 'wallet',
        feeId,
      },
    });

    res.status(200).json({ message: 'Fee payment successful', feeStatus });
  } catch (err) {
    console.error('Fee payment error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};
