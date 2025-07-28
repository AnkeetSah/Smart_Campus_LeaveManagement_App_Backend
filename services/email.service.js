// services/email.service.js
import transporter from '../config/mailer.js';
import ejs from 'ejs';
import path from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const sendCredentialsEmail = async ({ email, name, password }) => {
  const htmlContent = await ejs.renderFile(
    path.resolve(__dirname, '../emails/templates/credentialsEmail.ejs'),
    { name, email, password }
  );

  await transporter.sendMail({
    from: `"LeaveFlow Admin" <${process.env.EMAIL_USER}>`,
    to: email,
    subject: 'Your LeaveFlow Login Credentials',
    html: htmlContent,
  });
};
