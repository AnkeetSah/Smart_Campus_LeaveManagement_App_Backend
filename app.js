import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser'; // ✅ import this
import authRoutes from './routes/authRoutes.js';
import leaveRoutes from "./routes/leaveRoutes.js";
import userRoutes from './routes/userRoutes.js'
const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173', // 👈 frontend origin if using React
  credentials: true               // ✅ allows cookies to be sent
}));
app.use(express.json());
app.use(cookieParser()); // ✅ parse cookies from request
// Swagger route

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/me',userRoutes);
app.use('/api/leaves', leaveRoutes);
app.get('/', (req, res) => {
  res.send('API is working fine ✅');
});

export default app;
