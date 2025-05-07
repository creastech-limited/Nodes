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
  academicDetails: {
    classAdmittedTo: String,
    section: String,
    previousSchool: String,
    admissionDate: Date,
    boarding: Boolean
  },
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

const User = mongoose.model('User', userSchema);

module.exports = User;
