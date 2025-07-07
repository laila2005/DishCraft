const express = require('express');
const router = express.Router();
const sendEmail = require('../utils/sendEmail');

router.post('/', async (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ message: 'All fields are required.' });
  }

  try {
    const sent = await sendEmail({
      to: 'laila.mohamed.fikry@gmail.com',
      subject: `New Contact from ${name}`,
      html: `<p><strong>Email:</strong> ${email}</p><p>${message}</p>`
    });

    if (sent) {
      return res.status(200).json({ message: 'Message sent successfully!' });
    } else {
      return res.status(500).json({ message: 'Failed to send email.' });
    }
  } catch (err) {
    console.error('Contact error:', err.message);
    return res.status(500).json({ message: 'Internal server error.' });
  }
});

module.exports = router;
