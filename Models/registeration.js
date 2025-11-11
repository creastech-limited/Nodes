const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  name: { type: String},
  gender: { type: String},
  dateOfBirth: { type: Date },
  profilePicture: { type: String },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  address: {
    street: String,
    city: String,
    state: String,
    zipCode: String
  },
  guardian: {
    fullName: String,
    relationship: String,
    email: String,
    phone: String,
    occupation: String,
    address: String
  },
  bankDetails: {
    accountName: String,
    accountNumber: String,
    bankName: String,
    bankCode: String
  },
  academicDetails: {
    classAdmittedTo: String,
    section: String,
    previousSchool: String,
    admissionDate: Date,
    boarding: Boolean
  },
  classId: { type: String },
  refreshToken: {
    type: String,
  },
  country: { type: String },
  schoolName: { type: String },
  schoolAddress: { type: String },
  schoolType: { type: String },
  ownership: { type: String },
  registrationDate: { type: Date },
  storeName: { type: String },
  storeType: { type: String },
  location:{ type: String },
  description: { type: String },
  schoolId: { type: String },
  agentName: { type: String },
  pin: { type: String },
  email: { type: String, required: true, unique: true },
  phone: { type: String},
  accountNumber: { type: String, required: true },
  Class: { type: String },
  role: { 
    type: String, 
    required: true, 
    enum: ['student', 'school', 'parent', 'admin','store', 'agent'], // Add your roles here
  },
  password: { type: String, required: true },
  student_id: { type: String},
  agent_id: { type: String},
  store_id: { type: String},
  schoolRegistrationLink: { type: String},
  isFirstLogin: { type: Boolean, default: true },
  isPinSet: { type: Boolean, default: false },
  agentCanTopup: { type: Boolean, default: false },
  storeCanTopup: { type: Boolean, default: false },
  studentCanTopup: { type: Boolean, default: false },
  studentCanPayBill: { type: Boolean, default: false },
  schoolCanTopup: { type: Boolean, default: false },
  studentCanTransfer: { type: Boolean, default: false },
  studentCanWithdraw: { type: Boolean, default: false },
  storeCanTransfer: { type: Boolean, default: false },
  schoolCanTransfer: { type: Boolean, default: false },
  storeCanWithdraw: { type: Boolean, default: false },
  agentCanTransfer: { type: Boolean, default: false },
  agentCanWithdraw: { type: Boolean, default: false },
  referalCode: { type: String, },
  beneficiary: [
    { 
      firstName: String,
      lastName: String,
      name: String,
      email: String,
      phone: String,
    }
    ],
  qrcode: { type: String },
  lastLogin: Date,
  status: { 
    type: String, 
    default: "Inactive", 
    required: true, 
    enum: ['Active', 'Inactive'] // Add possible status values
  }
}, { timestamps: true });

// Password hashing without confirmPassword
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  // const salt = await bcrypt.genSalt(10);
  // this.password = await bcrypt.hash(this.password, salt);
  // Generate student_id or store_id based on role
userSchema.post('save', async function (doc, next) {
  if (doc.role === 'Student' && !doc.student_id) {
    doc.student_id = `${doc.schoolId}/${doc._id}`;
    await doc.save();
  }

  if (doc.role === 'Store' && !doc.store_id) {
    doc.store_id = `${doc.schoolId}/${doc._id}`;
    await doc.save();
  }
  if (doc.role === 'Agent' && !doc.agent_id) {
    doc.agent_id = `${doc.store_id}/${doc._id}`;
    await doc.save();
  }

 
  next();
})
});

const regUser = mongoose.model('User', userSchema);

//class model
const classSchema = new mongoose.Schema({
  className: { type: String, required: true },
  section: { type: String, required: true,default: '1' },
  schoolId: { type: String, required: true },
  students: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  description: { type: String },
  classTeacher: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
}, { timestamps: true });
const ClassUser = mongoose.model('Class', classSchema);

//beneficary model
const beneficiarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  name: { type: String},
  email: { type: String, required: true },
  phone: { type: String},
}, { timestamps: true });
const Beneficiary = mongoose.model('Beneficiary', beneficiarySchema);


//agent Model
const agentSchema = new mongoose.Schema({
  firstName: { type: String, required: true },
  lastName: { type: String, required: true },
  name: { type: String},
  email: { type: String, required: true },
  password: { type: String, required: true },
  agentCode: { type: String, unique: true },
  schoolId: { type: String, required: true },
  phone: { type: String, required: true },
  address: { type: String },
  
}, { timestamps: true });

agentSchema.pre('save', async function (next) {
  if(!this.agentCode){
    //generate the last five digists from the id
    this.agentCode = `${this._id.toString().slice(-5).toUpperCase()}`;
  }
  next();
});
const Agent = mongoose.model('Agent', agentSchema);


module.exports = {regUser, ClassUser, Beneficiary, Agent};
