// routes/emailRoutes.js
import express from 'express';
import { sendStyledEmail } from '../controllers/emailController.js';

const router = express.Router();

router.post('/send-template', sendStyledEmail);

export default router;
