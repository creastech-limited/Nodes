require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');


const app = express();

// middleware
app.use(cors({
  origin: ["http://localhost:3000","http://127.0.0.1:5503"], // For dev only; replace with your frontend URL in production
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  methods: ["GET", "POST", "PUT", "DELETE"]// Allowed HTTP methods
}));

app.use(cookieParser());
app.use(bodyParser.json());
app.use(morgan('dev'));
app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI);
const db = mongoose.connection;
//user.collection.dropIndex('schoolId_1')
db.once('open', async () => {
  console.log('Connected to Database');

  try {
    // Drop the unique index on userId in the wallets collection
    await db.collection('wallets').dropIndex('userId_1');
    console.log('Index dropped successfully');
  } catch (err) {
    if (err.codeName === 'IndexNotFound') {
      console.log('Index not found, skipping drop.');
    } else {
      console.error('Error dropping index:', err);
    }
  }
});

db.on('error', (error) => console.error('MongoDB connection error:', error));

// routes
const authRoute = require('./routes/auth');
const r = require('./routes/routes'); // ✅ Correct route file
const walletRoute = require('./routes/wallets'); // ✅ Correct route file
const transactionRoute = require('./routes/transactions')// ✅ Correct route file

//middlewware
app.use('/api/transaction', transactionRoute) // ✅ Correct route file
app.use('/api/users', authRoute)// ✅ Correct route file
app.use('/api', r); // e.g., /api/feedback will work
app.use('/api/wallet', walletRoute); // e.g., /api/wallet will work
// const registerRoute = require('./routes/register'); // ✅ Correct route file
// app.use('/api', registerRoute); // e.g., /api/register will work
const feedbackRoute = require('./routes/feedback'); // ✅ Correct route file
app.use('/api/feedback', feedbackRoute); // e.g., /api/feedback will work
app.get('/api/users/getusers/:id', (req, res) => {
  // Your logic for fetching user data
  const user = {
    id:1,
    firstName: 'David',
    lastName: 'Taiwo',
    email: 'david@123.com',
    phone: '1234567890',
    name: 'David Taiwo',
    email: 'davi@417.com',
    // other user data...
  };

  res.json({
    message: 'user found with the role: school',
    data: user,
  });
});

// port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
