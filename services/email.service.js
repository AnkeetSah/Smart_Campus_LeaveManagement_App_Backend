import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import transporter from "../config/mailer.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const sendCredentialsEmail = async ({ email, name, password }) => {
  try {
    const htmlContent = await ejs.renderFile(
      path.resolve(__dirname, "../emails/templates/credentialsEmail.ejs"),
      { name, email, password }
    );

    const info = await transporter.sendMail({
      from: `"LeaveFlow Admin" <${process.env.EMAIL_USER}>`, // Gmail sender
      to: email,
      subject: "Your LeaveFlow Login Credentials",
      html: htmlContent,
    });

    console.log("✅ Email sent:", info.messageId);
    return info;
  } catch (err) {
    console.error("❌ Email sending failed:", err);
    throw err;
  }
};
