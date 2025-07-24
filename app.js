import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import userRoutes from './routes/userRoutes.js';

const app = express();

// ✅ CORS SETUP (Only production domain)
const allowedOrigins = [
  process.env.NODE_ENV === 'development' && 'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean);

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
