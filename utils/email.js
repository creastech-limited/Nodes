const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com', // or your SMTP host
  port: 587, // or 587 for TLS
  secure: false, // true for 465, false for other ports
  // If using Gmail, you may need to enable "Less secure app access" or use an App Password
  // See: https://support.google.com/accounts/answer/6010255?hl=en
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false, // 👈 allows self-signed certs
  },
});

const sendEmail = async ({ to, subject, html, attachments}) => {
  if(!subject){
    subject = "No Subject"
  } if(!html){
    html = "<p>No Content</p>"
  }
  if (!to ) {
    throw new Error('To is required to send an email.');
  }
  
  const mailOptions = {
    from: process.env.EMAIL_USER || process.env.EMAIL_USER,
    to,
    subject,
    html,
    attachments: attachments || [], // Optional attachments
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent: ' + info.response);
    return info;
  } catch (error) {
    console.error('Error sending email:', error.message, error.response);
    throw error;
  }
};

module.exports = sendEmail;
