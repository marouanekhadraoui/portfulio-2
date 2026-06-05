const Message = require('../models/Message');
const { sendEmail } = require('../services/emailService');

const sendMessage = async (req, res) => {

  try {

    // 1. save to DB
    const message = await Message.create(req.body);

    // 2. send email
    await sendEmail(req.body);

    return res.status(201).json({
      success: true,
      message: "Message saved & email sent 🚀",
      data: message
    });

  } catch (error) {

    return res.status(500).json({
      success: false,
      error: error.message
    });

  }
};

module.exports = { sendMessage };