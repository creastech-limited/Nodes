const QRCode = require('qrcode');
const {regUser, ClassUser, Beneficiary} = require('../Models/registeration');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const XLSX = require('xlsx');
const sendEmail = require('../utils/email');
const FeeStatus = require('../Models/fees');
const {Fee, FeePayment} = require('../Models/fees');
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const Wallet = require('../Models/walletSchema'); // Import Wallet model




// helper to generate unique 10-digit account number starting with 9
async function generateUniqueAccountNumber() {
  const generateAccountNumber = () =>
    Math.floor(9000000000 + Math.random() * 1000000000).toString();

  let accountNumber;
  let isUnique = false;

  while (!isUnique) {
    accountNumber = generateAccountNumber();
    const exists = await regUser.findOne({ accountNumber });
    if (!exists) isUnique = true;
  }
  return accountNumber;
}

// ✅ Main helper
async function createUserFromPayload(payload, decodedToken = {}) {
  try {
    const userId = decodedToken.user?.id;
    if(!userId){
      return { success: false, error: 'Unauthorized: No user ID found in request' };
    }
    console.log("Creating user initiated by user ID:", userId);
    const currentUser = await regUser.findById(userId);
    if (!currentUser) {
      return { success: false, error: 'Current user not found' };
    }
    const schoolRole = currentUser.role.toLowerCase();
    const schoolId = currentUser.schoolId || '';
    console.log("Creating user initiated by user with role:", schoolRole, "and schoolId:", schoolId); 
    const {
      firstName,
      lastName,
      name = `${payload.firstName || ''} ${payload.lastName || ''}`.trim(),
      gender,
      dateOfBirth,
      country,
      boarding,
      email,
      phone,
      password,
      profilePicture,
      storeName,
      storeType,
      ownership,
      store_id,
      student_id,
      section,
      schoolName,
      schoolType,
      schoolAddress,
      agentName,
      Class,
      role,
      academicDetails = {},
      classId,
      pin,
      lastLogin,
      agent_id,
      schoolRegistrationLink,
      refreshToken,
      status = 'Inactive',
      // address + guardian fields
      street,
      city,
      state,
      zipCode,
      guardianFullName,
      guardianRelationship,
      guardianEmail,
      guardianPhone,
      guardianOccupation,
      guardianAddress,
      classAdmittedTo,
      previousSchool,
      admissionDate
    } = payload;

    if (!email) return { success: false, error: 'Email is required' };
    if (!password) return { success: false, error: 'Password is required' };

    const existingUser = await regUser.findOne({ email: email.toLowerCase().trim() });
    if (existingUser) return { success: false, error: 'Email already in use' };

    // role, schoolId resolution
    const roleLower = role ? role.toLowerCase() : 'student';
    const tokenSchoolId = schoolId||decodedToken.id || payload.schoolId || '';
    let resolvedSchoolId = schoolId || tokenSchoolId || '';
    let resolvedSchoolName = decodedToken.name || schoolName || '';
    let resolvedSchoolType = decodedToken.type || schoolType || '';
    let resolvedSchoolAddress = decodedToken.address || schoolAddress || '';
    let resolvedOwnership = decodedToken.ownership || ownership || '';

    if ((roleLower === 'student' || roleLower === 'store') && tokenSchoolId) {
      const schoolUser = await regUser.findOne({ schoolId: tokenSchoolId, role: 'school' });
      if (!schoolUser) return { success: false, error: 'School with provided ID not found' };
      resolvedSchoolName = schoolUser.schoolName;
      resolvedSchoolType = schoolUser.schoolType;
      resolvedSchoolAddress = schoolUser.schoolAddress;
      resolvedOwnership = schoolUser.ownership;
      resolvedSchoolId = schoolUser.schoolId;
    }

    const address = { street, city, state, zipCode };

    const guardian = {
      fullName: guardianFullName,
      relationship: guardianRelationship,
      email: guardianEmail,
      phone: guardianPhone,
      occupation: guardianOccupation,
      address: guardianAddress
    };

    if (guardianEmail) {
      const existingGuardian = await regUser.findOne({ email: guardianEmail });
      if (existingGuardian) {
        guardian.fullName = existingGuardian.name || guardian.fullName;
        guardian.email = existingGuardian.email;
        guardian.phone = existingGuardian.phone || guardian.phone;
      }
    }

    const academic = {
      classAdmittedTo: classAdmittedTo || (academicDetails && academicDetails.classAdmittedTo),
      section: section,
      previousSchool,
      admissionDate,
    };

    // generate account number
    const accountNumber = await generateUniqueAccountNumber();

    // hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // generate schoolId if role = school
    let generatedSchoolId = resolvedSchoolId;
    if (roleLower === 'school' && !resolvedSchoolId) {
      const nameClean = (schoolName || 'XXX').toUpperCase().replace(/[^A-Z]/g, '');
      const letters = (nameClean[0] || 'X') + (nameClean[1] || 'Y') + (nameClean[2] || 'Z');
      const numbers = Math.floor(100000 + Math.random() * 900000).toString();
      generatedSchoolId = `${letters}${numbers}`;
    }

    let roleSpecificId = {};
    let dynamicSchoolLink = '';

    const newUser = new regUser({
      firstName,
      lastName,
      name,
      gender,
      dateOfBirth,
      profilePicture,
      address,
      guardian,
      schoolId: generatedSchoolId,
      academicDetails: academic,
      country,
      schoolName: resolvedSchoolName || schoolName,
      schoolAddress: resolvedSchoolAddress || schoolAddress,
      schoolType: resolvedSchoolType || schoolType,
      ownership: resolvedOwnership || ownership,
      store_id,
      section,
      student_id,
      storeName,
      storeType,
      accountNumber,
      agent_id,
      agentName,
      Class,
      email: email.toLowerCase().trim(),
      phone,
      schoolRegistrationLink: '',
      boarding,
      password: hashedPassword,
      refreshToken: null,
      role,
      pin: '',
      lastLogin,
      registrationDate: new Date(),
      status
    });

    let schoolDBID = null;
    if (!['school', 'parent', 'admin'].includes(roleLower)) {
      const existingSchool = await regUser.findOne({ schoolId: generatedSchoolId, role: 'school' });
      if (!existingSchool) return { success: false, error: 'School with provided ID not found' };
      schoolDBID = existingSchool._id;
    }

    // ✅ Assign student to class
    if (roleLower === 'student' && academic.classAdmittedTo && schoolDBID) {
      const foundClass = await ClassUser.findOne({
        className: academic.classAdmittedTo,
        schoolId: schoolDBID
      });
      if (!foundClass) {
        return { success: false, error: `Class '${academic.classAdmittedTo}' not found for this school.` };
      }

      const currentTerm = payload.term || 'First Term';
      const currentSession = payload.session || '2025';

      const classFees = await Fee.find({
        classId: foundClass._id,
        term: currentTerm,
        session: currentSession
      });

      for (const fee of classFees) {
        const exists = await FeeStatus.findOne({ studentId: newUser._id, feeId: fee._id });
        if (!exists) await FeeStatus.create({ studentId: newUser._id, feeId: fee._id });
      }

      newUser.academicDetails.classAdmittedTo = foundClass.className;
      newUser.Class = foundClass._id;
      newUser.classId = foundClass._id;
      foundClass.students.push(newUser._id);
      await foundClass.save();
    }

    // role-based IDs
    switch (roleLower) {
      case 'student':
        roleSpecificId = { student_id: `${generatedSchoolId}/${newUser._id}` };
        break;
      case 'agent':
        roleSpecificId = { agent_id: `${store_id}/${newUser._id}` };
        break;
      case 'store':
        roleSpecificId = { store_id: `${generatedSchoolId}/${newUser._id}` };
        dynamicSchoolLink = `/?store_id=${encodeURIComponent(store_id)}&storeName=${encodeURIComponent(storeName)}&storeType=${encodeURIComponent(storeType)}`;
        break;
      case 'school':
        roleSpecificId = { schoolId: generatedSchoolId };
        dynamicSchoolLink = `/?schoolId=${encodeURIComponent(generatedSchoolId)}&schoolName=${encodeURIComponent(schoolName)}&schoolAddress=${encodeURIComponent(schoolAddress)}&schoolType=${encodeURIComponent(schoolType)}&ownership=${encodeURIComponent(ownership)}`;
        break;
    }
    Object.assign(newUser, roleSpecificId);
    if (dynamicSchoolLink) newUser.schoolRegistrationLink = dynamicSchoolLink;

    await newUser.save();

    // create classes for new school
    if (roleLower === 'school') {
      const getDefaultClasses = (type) => {
        if (type && type.toLowerCase().includes('secondary')) {
          return ['JSS1', 'JSS2', 'JSS3', 'SS1', 'SS2', 'SS3'];
        }
        return ['Primary 1', 'Primary 2', 'Primary 3', 'Primary 4', 'Primary 5', 'Primary 6'];
      };
      const defaultClasses = getDefaultClasses(schoolType);
      const classDocuments = defaultClasses.map(className => ({
        className,
        section: section || '1',
        schoolId: newUser._id
      }));
      await ClassUser.insertMany(classDocuments);
    }

    // create wallet
    await Wallet.create({
      userId: newUser._id,
      currency: 'NGN',
      type: 'user',
      balance: 0,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
      phone: newUser.phone,
      accountNumber: newUser.accountNumber
    });

    // generate QR code
    const qrData = JSON.stringify({ email: newUser.email, name: newUser.name });
    const qrCodeDataUrl = await QRCode.toDataURL(qrData);
    newUser.qrcode = qrCodeDataUrl;
    await newUser.save();

    const base64Image = qrCodeDataUrl.replace(/^data:image\/png;base64,/, '');

    // email notification
    await sendEmail({
      to: newUser.email,
      subject: 'Confirm Notification',
      html: `<p>Hello ${newUser.firstName},</p>
             <p>You have successfully registered with the school wallet solution.<br/>
             Click the link <a href='${process.env.NGROK_URL}/api/activate/${newUser._id}'>activate</a> to activate your account.</p>
             <p>Best regards,<br>Your Company Name</p>`,
      attachments: [
        {
          content: base64Image,
          filename: 'qrcode.png',
          type: 'image/png',
          disposition: 'attachment'
        }
      ]
    });

    if (roleLower === 'admin') {
      newUser.qrcode = null;
      await newUser.save();
      await Wallet.deleteOne({ userId: newUser._id });
    }

    return { success: true, user: newUser };
  } catch (err) {
    console.error('createUserFromPayload error:', err);
    return { success: false, error: err.message || 'Server error' };
  }
}

module.exports = { createUserFromPayload };
