// require('dotenv').config();
// const nodemailer = require('nodemailer');

// async function testMail() {
//   try {
//     const transporter = nodemailer.createTransport({
//       host: 'smtp.gmail.com',
//       port: 465,
//       secure: true, // SSL
//       auth: {
//         user: process.env.Email_USER,
//         pass: process.env.Email_PASS,
//       },
//     });

//     const info = await transporter.sendMail({
//       from: process.env.EMAIL_FROM,
//       to: 'taiwodavid19@gmail.com',
//       subject: 'SMTP Connection Test',
//       text: 'Hello from Node.js test!',
//     });

//     console.log('✅ Sent:', info.response);
//   } catch (error) {
//     console.error('❌ Connection failed:', error);
//   }
// }

// testMail();
require('dotenv').config();
const sendEmail = require('./utils/email');
(async () => {
  try {
    await sendEmail(
      'tdavid@yopmail.com', // 👈 replace with your real email
      '✅ Test Email from Peak-Financials',
      `<h2>Hello!</h2>
       <p>This is a <strong>test email</strong> from your Node.js app using Brevo (Sendinblue).</p>
       <p>If you received this, your email setup works perfectly 🎉</p>`
    );
    console.log('✅ Test email sent successfully!');
  } catch (error) {
    console.error('❌ Test email failed:', error.message);
  }
})();
