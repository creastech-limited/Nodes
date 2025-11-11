require('dotenv').config();
const nodemailer = require('nodemailer');

async function testMail() {
  try {
    const transporter = nodemailer.createTransport({
      host: 'smtp.gmail.com',
      port: 465,
      secure: true, // SSL
      auth: {
        user: process.env.Email_USER,
        pass: process.env.Email_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: 'taiwodavid19@gmail.com',
      subject: 'SMTP Connection Test',
      text: 'Hello from Node.js test!',
    });

    console.log('✅ Sent:', info.response);
  } catch (error) {
    console.error('❌ Connection failed:', error);
  }
}

testMail();
