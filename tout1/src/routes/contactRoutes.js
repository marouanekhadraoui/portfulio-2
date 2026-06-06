const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const { sendEmail } = require('../services/emailService');

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const validateContact = (req, res, next) => {
  const { firstName, lastName, email, message, website } = req.body;

  if (website) {
    return res.status(400).json({ success: false, message: 'Invalid submission.' });
  }

  if (!firstName?.trim() || firstName.trim().length < 2) {
    return res.status(400).json({ success: false, message: 'First name is required (min 2 characters).' });
  }
  if (!lastName?.trim() || lastName.trim().length < 2) {
    return res.status(400).json({ success: false, message: 'Last name is required (min 2 characters).' });
  }
  if (!email?.trim() || !emailRegex.test(email.trim())) {
    return res.status(400).json({ success: false, message: 'A valid email address is required.' });
  }
  if (!message?.trim() || message.trim().length < 20) {
    return res.status(400).json({ success: false, message: 'Message must be at least 20 characters.' });
  }

  req.body = {
    firstName: firstName.trim(),
    lastName: lastName.trim(),
    email: email.trim().toLowerCase(),
    subject: req.body.subject?.trim() || 'General inquiry',
    message: message.trim(),
  };

  next();
};

router.post('/', validateContact, async (req, res) => {
  try {
    const msg = await Message.create(req.body);

    let emailResult = { provider: 'none' };

    try {
      emailResult = await sendEmail(req.body);
    } catch (emailErr) {
      console.error("Email failed but message saved:", emailErr);
    }

    return res.status(201).json({
      success: true,
      message: 'Message sent successfully.',
      data: { id: msg._id, emailProvider: emailResult.provider },
    });

  } catch (err) {
    console.error('Contact error:', err);

    return res.status(500).json({
      success: false,
      message: err.message || 'Server error',
    });
  }
});

router.get('/all', async (req, res) => {
  try {
    const messages = await Message.find().sort({ createdAt: -1 });
    res.json(messages);
  } catch (err) {
    res.status(500).json({ success: false, error: 'Failed to fetch messages' });
  }
});

module.exports = router;
