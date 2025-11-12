const nodemailer = require('nodemailer');
require('dotenv').config();

const SibApiV3Sdk = require('@sendinblue/client');
const client = new SibApiV3Sdk.TransactionalEmailsApi();

client.setApiKey(
  SibApiV3Sdk.TransactionalEmailsApiApiKeys.apiKey,
  process.env.BREVO_API_KEY // add this to .env
);

async function sendEmail(to, subject, htmlContent) {
  try {
    const response = await client.sendTransacEmail({
      sender: { email: "itsupport@creastech.com", name: "XPay" },
      to: [{ email: to }],
      subject,
      htmlContent,
    });

    console.log('✅ Email sent:', response.body);
  } catch (error) {
    console.error('❌ Error sending email:', error .response ? error.response.body : error.message);
    throw new Error('Failed to send email');
  }
}



// const transporter = nodemailer.createTransport({
//   host: 'smtp.gmail.com', // or your SMTP host
//   port: 465, // or 587 for TLS
//   secure: true, // true for 465, false for other ports
//   // If using Gmail, you may need to enable "Less secure app access" or use an App Password
//   // See: https://support.google.com/accounts/answer/6010255?hl=en
//   service: 'gmail',
//   auth: {
//     user: process.env.EMAIL_USER,
//     pass: process.env.EMAIL_PASS,
//   },
//   tls: {
//     rejectUnauthorized: false, // 👈 allows self-signed certs
//   },
// });

// const sendEmail = async ({ to, subject, html, attachments}) => {
//   if(!subject){
//     subject = "No Subject"
//   } if(!html){
//     html = "<p>No Content</p>"
//   }
//   if (!to ) {
//     throw new Error('To is required to send an email.');
//   }
  
//   const mailOptions = {
//     from: process.env.EMAIL_USER || process.env.EMAIL_USER,
//     to,
//     subject,
//     html,
//     attachments: attachments || [], // Optional attachments
//   };

//   try {
//     const info = await transporter.sendMail(mailOptions);
//     console.log('Email sent: ' + info.response);
//     return info;
//   } catch (error) {
//     console.error('Error sending email:', error.message, error.response);
//     throw error;
//   }
// };

module.exports = sendEmail;
