'use strict';

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const port = process.env.PORT || 4000;

app.use(cors({
  origin: [
    'https://suvidhapos.com',
    'https://www.suvidhapos.com',
    'http://localhost:4000',
    'http://localhost:5173'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'], 
  optionsSuccessStatus: 200
}));
// Ensure preflight requests receive CORS headers
app.options('*', cors());
app.use(express.json());

app.get('/health', (req, res) => res.json({ ok: true }));

app.post('/api/contact', async (req, res) => {
  const { name, email, phone, subject, message } = req.body || {};
  if (!name || !email || !message) {
    return res.status(400).json({ ok: false, error: 'Missing required fields: name, email, message' });
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: (process.env.SMTP_SECURE || 'true') === 'true',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });

    const toEmail = process.env.TO_EMAIL || process.env.SMTP_USER;

    const info = await transporter.sendMail({
      from: process.env.FROM_EMAIL || `"Suvidha POS Contact" <${process.env.SMTP_USER}>`,
      to: toEmail,
      replyTo: email,
      subject: subject ? `[Contact] ${subject}` : 'New contact form submission',
      text: [
        `Name: ${name}`,
        `Email: ${email}`,
        phone ? `Phone: ${phone}` : null,
        `Subject: ${subject || '(none)'}`,
        '',
        message
      ].filter(Boolean).join('\n'),
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6">
          <h2>New contact form submission</h2>
          <p><strong>Name:</strong> ${escapeHtml(name)}</p>
          <p><strong>Email:</strong> ${escapeHtml(email)}</p>
          ${phone ? `<p><strong>Phone:</strong> ${escapeHtml(phone)}</p>` : ''}
          <p><strong>Subject:</strong> ${escapeHtml(subject || '(none)')}</p>
          <hr />
          <p>${escapeHtml(message).replace(/\n/g, '<br/>')}</p>
        </div>
      `
    });

    return res.json({ ok: true, messageId: info.messageId });
  } catch (err) {
    console.error('Email send failed:', err);
    return res.status(500).json({ ok: false, error: 'Failed to send email' });
  }
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g,'&lt;')
    .replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;')
    .replace(/'/g,'&#039;');
}


