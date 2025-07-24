import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import userRoutes from './routes/userRoutes.js';

const app = express();

// ✅ INDUSTRY-STANDARD CORS SETUP
const allowedOrigins = [
  'http://localhost:5173',
  process.env.FRONTEND_URL, // e.g., https://leaveflow.netlify.app
].filter(Boolean); // removes undefined/null if FRONTEND_URL is missing

const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like Postman)
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
};

// Middleware
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/me', userRoutes);
app.use('/api/leaves', leaveRoutes);

app.get('/', (req, res) => {
  res.send('API is working fine ✅');
});

export default app;
