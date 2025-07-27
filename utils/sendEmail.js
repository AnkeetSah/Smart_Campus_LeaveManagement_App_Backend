// utils/sendEmail.js
import ejs from 'ejs';
import path from 'path';
import transporter from '../config/mailer.js';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

// 🧠 __dirname workaround in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const sendEmail = async ({ to, subject, templateName, data }) => {
  try {
    const templatePath = path.join(__dirname, '..', 'templates', `${templateName}.ejs`);
    const html = await ejs.renderFile(templatePath, data);

    const info = await transporter.sendMail({
      from: `"MyApp" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html,
    });

    console.log('Email sent: %s', info.messageId);
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error);
    return { success: false, error };
  }
};

export default sendEmail;
