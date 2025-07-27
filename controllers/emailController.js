// controllers/emailController.js
import sendEmail from '../utils/sendEmail.js';

export const sendStyledEmail = async (req, res) => {
  const { to, username, message, subject } = req.body;

  const result = await sendEmail({
    to,
    subject,
    templateName: 'emailTemplate',
    data: {
      username,
      message,
      subject,
    },
  });

  if (result.success) {
    res.status(200).json({ message: 'Styled email sent successfully' });
  } else {
    res.status(500).json({ message: 'Failed to send styled email', error: result.error });
  }
};
