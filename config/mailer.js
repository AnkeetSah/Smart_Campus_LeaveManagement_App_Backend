import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST, // e.g. "smtp.gmail.com"
  port: 587,  // ✅ use STARTTLS instead of SSL
  secure: false, // false = STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App Password if Gmail
  },
});

export default transporter;
