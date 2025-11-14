require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const fs = require('fs');
const path = require('path');


const app = express();

// middleware
app.use(cors({
  origin: [
    "http://localhost:8080", "http://localhost:5000","http://localhost:3000","http://127.0.0.1:5503","http://localhost:5174","http://localhost:5173", "https://xpay.jolade-boluwatife.workers.dev","https://nodes-production-2b39.up.railway.app", "nodes-production-2b39.up.railway.app", "https://nodes-staging.up.railway.app/api/users/register","https://nodes-production-12.up.railway.app","https://xmwhs-prod.onrender.com","https://xmwhs-m2fk.onrender.com","https://xmwhs-3ftj.onrender.com","https://d2d3engv7ow8ch.cloudfront.net","https://d2flijhjzhgpyx.cloudfront.net","https://test.creastech.com","https://nodes-mxxd.onrender.com",
    "https://app.xpay.ng",
    "app.xpay.ng",
  "http://localhost:3000",
  "http://127.0.0.1:3000",
  "http://10.0.2.2",      // Android emulator localhost
  "http://10.0.2.2:3000",
  "http://10.0.2.16",     // Your current emulator IP
  "http://10.0.2.16:3000",
  /^http:\/\/10\.0\.2\.\d+$/,  // Allow entire 10.0.2.x range
  /^http:\/\/10\.0\.2\.\d+:\d+$/ // With any port


  ], // For dev only; replace with your frontend URL in production
  credentials: true, // Allow credentials (cookies, authorization headers, etc.)
  methods: ["GET", "POST", "PUT", "DELETE"]// Allowed HTTP method
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
const chargeRoute = require('./routes/charge'); // ✅ Correct route file
const feeRoute = require('./routes/fees');// ✅ Correct route file
const pinRoute = require('./routes/pin'); // ✅ Correct route file
const disputeRoute = require('./routes/dispute'); // ✅ Correct route file
const r = require('./routes/routes'); // ✅ Correct route file
const walletRoute = require('./routes/wallets'); // ✅ Correct route file
const transactionRoute = require('./routes/transactions')// ✅ Correct route file
const notificationRoute = require('./routes/notification'); // ✅ Correct route file
const otpRoute = require('./routes/otp'); // ✅ Correct route file



const uploadDir = path.join(__dirname, 'uploads');

// Create the uploads folder if it doesn't exist
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}


//middlewware
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/api/transaction', transactionRoute) // ✅ Correct route file
app.use('/api/notification', notificationRoute); // ✅ Correct route file
app.use('/api/users', authRoute)// ✅ Correct route file
app.use('/api/pin', pinRoute); // e.g., /api/pin will work
app.use('/api/fee', feeRoute); // e.g., /api/fee will work
app.use('/api', r); // e.g., /api/feedback will work
app.use('/api/dispute', disputeRoute); // e.g., /api/dispute will work
app.use('/api/charge', chargeRoute); // e.g., /api/charge will work
app.use('/api/wallet', walletRoute); // e.g., /api/wallet will work
app.use('/api/otp', otpRoute); // e.g., /api/otp will work
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
// Health check route for AWS / Monitoring
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'UP',
    message: '🚀 Loan Core API is healthy and running',
    timestamp: new Date().toISOString(),
  });
});


// port
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
// require('dotenv').config();
// const express = require('express');
// const cors = require('cors');
// const mongoose = require('mongoose');
// const morgan = require('morgan');
// const bodyParser = require('body-parser');
// const cookieParser = require('cookie-parser');

// const app = express();

// // ✅ Middleware
// app.use(cors({
//   origin: [
//     "http://localhost:8080",
//     "http://localhost:3000",
//     "http://127.0.0.1:5503",
//     "http://localhost:5174",
//     "https://xpay.jolade-boluwatife.workers.dev",
//     "nodes-production-2b39.up.railway.app",
//     "https://nodes-production-2b39.up.railway.app"
//   ],
//   credentials: true,
//   methods: ["GET", "POST", "PUT", "DELETE"]
// }));

// app.use(cookieParser());
// app.use(bodyParser.json());
// app.use(morgan('dev'));
// app.use(express.json());

// // ✅ MongoDB Connection
// mongoose.connect(process.env.MONGO_URI, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true
// });

// const db = mongoose.connection;

// db.once('open', async () => {
//   console.log('✅ Connected to MongoDB');

//   try {
//     await db.collection('wallets').dropIndex('userId_1');
//     console.log('Dropped index `userId_1` in wallets');
//   } catch (err) {
//     if (err.codeName === 'IndexNotFound') {
//       console.log('Index not found, skipping drop.');
//     } else {
//       console.error('❌ Error dropping index:', err);
//     }
//   }
// });

// db.on('error', (error) => {
//   console.error('❌ MongoDB connection error:', error);
// });

// // ✅ Routes
// app.use('/api/transaction', require('./routes/transactions'));
// app.use('/api/notification', require('./routes/notification'));
// app.use('/api/users', require('./routes/auth'));
// app.use('/api/pin', require('./routes/pin'));
// app.use('/api/fee', require('./routes/fees'));
// app.use('/api', require('./routes/routes'));
// app.use('/api/dispute', require('./routes/dispute'));
// app.use('/api/wallet', require('./routes/wallets'));
// app.use('/api/feedback', require('./routes/feedback'));

// // ✅ Sample Test Route
// app.get('/api/users/getusers/:id', (req, res) => {
//   const user = {
//     id: 1,
//     firstName: 'David',
//     lastName: 'Taiwo',
//     email: 'david@123.com',
//     phone: '1234567890',
//     name: 'David Taiwo'
//   };

//   res.json({
//     message: 'User found with the role: school',
//     data: user,
//   });
// });

// // ✅ Root Health Check (Required by Railway)
// app.get('/', (req, res) => {
//   res.send('🚀 XPay backend server is up and running');
// });

// // ✅ Start Server
// const PORT = process.env.PORT || 3000;
// app.listen(PORT, () => {
//   console.log(`🚀 Server is listening on port ${PORT}`);
// });
