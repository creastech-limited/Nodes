const express = require('express');
const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const router = express.Router();

const WEBINAR_DETAILS = {
  title: 'Transforming Customer Experience with AI-Powered Contact Center Solutions',
  date: 'Thursday, May 7th, 2026',
  time: '11:00 AM - 12:30 PM (WAT)',
  zoomLink: 'https://us06web.zoom.us/j/82986785755',
};

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

// Load HTML templates once at startup
const confirmationTemplate = fs.readFileSync(
  path.join(__dirname, '../Re_envrionment files/creastech_webinar_confirmation.html'),
  'utf8'
);

const internalTemplate = fs.readFileSync(
  path.join(__dirname, '../Re_envrionment files/creastech_webinar_internal.html'),
  'utf8'
);

// Replace {{placeholders}} in a template
const fillTemplate = (template, data) => {
  return Object.keys(data).reduce((html, key) => {
    return html.replace(new RegExp(`{{${key}}}`, 'g'), data[key] || '');
  }, template);
};

// POST /webinar/register
router.post('/register', async (req, res) => {
  try {
    const { fullName, email, phone, company, jobTitle, howDidYouHear } = req.body;

    if (!fullName || !email) {
      return res.status(400).json({ error: 'Please provide your full name and email address' });
    }

    if (!process.env.ZOHO_EMAIL || !process.env.ZOHO_PASSWORD) {
      console.error('Missing email configuration');
      return res.status(500).json({ error: 'Email service is not configured' });
    }

    const backendUrl = process.env.BACKEND_URL || '';
    const transporter = getTransporter();

    const confirmationHtml = fillTemplate(confirmationTemplate, {
      fullName,
      title:    WEBINAR_DETAILS.title,
      date:     WEBINAR_DETAILS.date,
      time:     WEBINAR_DETAILS.time,
      zoomLink: WEBINAR_DETAILS.zoomLink,
      backendUrl,
    });

    const internalHtml = fillTemplate(internalTemplate, {
      fullName,
      email,
      phone:          phone          || 'Not provided',
      company:        company        || 'Not provided',
      jobTitle:       jobTitle       || 'Not provided',
      howDidYouHear:  howDidYouHear  || 'Not provided',
      date:           WEBINAR_DETAILS.date,
      timestamp:      new Date().toLocaleString('en-NG', { timeZone: 'Africa/Lagos' }),
      backendUrl,
    });

    // Internal notification to team
    await transporter.sendMail({
      from:    `"${process.env.ZOHO_FROM_NAME}" <${process.env.ZOHO_FROM_EMAIL}>`,
      to:      'info@creastech.com',
      replyTo: email,
      subject: `New Webinar Registration: ${fullName}`,
      html:    internalHtml,
      text:    `New registration: ${fullName} (${email}). Company: ${company || 'N/A'}. Phone: ${phone || 'N/A'}.`,
    });

    // Confirmation email to registrant
    await transporter.sendMail({
      from:    `"${process.env.ZOHO_FROM_NAME}" <${process.env.ZOHO_FROM_EMAIL}>`,
      to:      email,
      subject: `You are Registered! ${WEBINAR_DETAILS.title}`,
      html:    confirmationHtml,
      text:    `Dear ${fullName}, your registration is confirmed. Date: ${WEBINAR_DETAILS.date}. Time: ${WEBINAR_DETAILS.time}. Join: ${WEBINAR_DETAILS.zoomLink}`,
    });

    return res.json({ success: true, message: 'Registration successful! Check your email for webinar details.' });
  } catch (error) {
    console.error('Webinar error:', error);
    return res.status(500).json({ error: 'Failed to register. Please try again later.' });
  }
});

module.exports = router;