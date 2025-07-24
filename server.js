import dotenv from 'dotenv';
import app from './app.js';
import connectDB from './config/db.js';

// Load env variables
dotenv.config();

// Connect to MongoDB
connectDB();
console.log("✅ MONGO_URI:", process.env.MONGO_URI);
// Start the server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
