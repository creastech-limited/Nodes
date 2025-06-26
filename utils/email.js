const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
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
