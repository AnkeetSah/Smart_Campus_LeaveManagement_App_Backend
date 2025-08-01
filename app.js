// server.js or app.js
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes.js';
import leaveRoutes from './routes/leaveRoutes.js';
import userRoutes from './routes/userRoutes.js';
import changingRoutes from './routes/changingRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
// import emailRoutes from './routes/emailRoutes.js'
import adminRoutes from './routes/adminRoutes.js'
const app = express();

// ✅ Define allowed origins clearly
const allowedOrigins = [
  'http://localhost:5173', // dev frontend
  process.env.FRONTEND_URL, // deployed frontend (e.g., Netlify URL)
];

// ✅ CORS options
const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.error(`❌ Blocked by CORS: ${origin}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // ✅ Allow cookies to be sent
};

// ✅ Apply middlewares
app.use(cors(corsOptions));
app.use(express.json());
app.use(cookieParser());

// ✅ Routes
app.use('/api/auth', authRoutes);
app.use('/api/me', userRoutes);
app.use('/api/leaves', leaveRoutes);
// app.use('/api/email',emailRoutes)
app.use("/api/admin", adminRoutes);
app.use("/api/change", changingRoutes);
app.use('/api/notifications', notificationRoutes);
app.get('/', (req, res) => {
  res.send('API is working fine ✅');
});

export default app;
