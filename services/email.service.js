import { Resend } from "resend";
import ejs from "ejs";
import path from "path";
import { fileURLToPath } from "url";
import { dirname } from "path";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const resend = new Resend(process.env.RESEND_API_KEY);

export const sendCredentialsEmail = async ({ email, name, password }) => {
  try {
    const htmlContent = await ejs.renderFile(
      path.resolve(__dirname, '../emails/templates/credentialsEmail.ejs'),
      { name, email, password }
    );

    const message = await resend.emails.send({
from: "LeaveFlow Admin <onboarding@resend.dev>",
   // verified
      to: email,
      subject: "Your LeaveFlow Login Credentials",
      html: htmlContent,
    });

    console.log("✅ Email response:", message); // log full response
  } catch (err) {
    console.error("❌ Email sending failed:", err);
    throw err;
  }
};
