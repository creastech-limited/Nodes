const express = require('express');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const getTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.ZOHO_SMTP_HOST,
    port: Number(process.env.ZOHO_SMTP_PORT),
    secure: Number(process.env.ZOHO_SMTP_PORT) === 465,
    requireTLS: Number(process.env.ZOHO_SMTP_PORT) === 587,
    auth: {
      user: process.env.ZOHO_EMAIL,
      pass: process.env.ZOHO_PASSWORD,
    },
    tls: { minVersion: 'TLSv1.2' },
  });
};

// Load HTML template once at startup
const confirmationTemplate = fs.readFileSync(
  path.join(__dirname, '../Re_envrionment files/creastech_contact_confirmation.html'),
  'utf8'
);

// Replace {{placeholders}} in a template
const fillTemplate = (template, data) => {
  return Object.keys(data).reduce((html, key) => {
    return html.replace(new RegExp(`{{${key}}}`, 'g'), data[key] || '');
  }, template);
};

// POST /contact
router.post('/', async (req, res) => {
  try {
    const { fullName, company, email, phone, service, message } = req.body;

    if (!fullName || !email || !message) {
      return res.status(400).json({ error: 'Please fill in all required fields' });
    }

    const backendUrl = process.env.BACKEND_URL || '';
    const transporter = getTransporter();

    // Internal notification to admin (plain HTML is fine here)
    await transporter.sendMail({
      from:    `"${process.env.ZOHO_FROM_NAME}" <${process.env.ZOHO_FROM_EMAIL}>`,
      to:      'info@creastech.com',
      replyTo: email,
      subject: `New Contact Form Submission from ${fullName}`,
      html: `
        <h2>New Contact Form Submission</h2>
        <p><strong>Name:</strong> ${fullName}</p>
        <p><strong>Email:</strong> ${email}</p>
        ${company ? `<p><strong>Company:</strong> ${company}</p>` : ''}
        ${phone   ? `<p><strong>Phone:</strong> ${phone}</p>`     : ''}
        ${service ? `<p><strong>Service:</strong> ${service}</p>` : ''}
        <p><strong>Message:</strong> ${message}</p>
      `,
    });

    // Branded confirmation email to user
    const confirmationHtml = fillTemplate(confirmationTemplate, {
      fullName,
      service:        service        || 'Not specified',
      messagePreview: message.length > 300 ? message.substring(0, 300) + '...' : message,
      backendUrl,
    });

    await transporter.sendMail({
      from:    `"${process.env.ZOHO_FROM_NAME}" <${process.env.ZOHO_FROM_EMAIL}>`,
      to:      email,
      subject: 'Thank you for contacting Creastech Limited',
      html:    confirmationHtml,
      text:    `Dear ${fullName}, thank you for contacting Creastech Limited. We will get back to you within 24-48 business hours.`,
    });

    return res.json({ success: true, message: 'Message sent successfully!' });
  } catch (error) {
    console.error('Contact error:', error);
    return res.status(500).json({ error: 'Failed to send message. Please try again later.' });
  }
});

module.exports = router;