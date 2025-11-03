// seeders/seedWarden.js
import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import connectDB from "../config/db.js";
import Warden from "../models/Warden.js";

dotenv.config();

// ✅ Connect to MongoDB
await connectDB();

const seedWarden = async () => {
  try {
    const hashedPassword = await bcrypt.hash("123456", 10); // default password

    // 🔄 Upsert wardens: insert if email doesn't exist
    const wardens = [
      {
        name: "Suraj Warden",
        email: "warden@demo.com",
        password: hashedPassword,
        hostel: "Hostel D",
        firstLogin: true,
      },
    ];

    for (const warden of wardens) {
      await Warden.updateOne(
        { email: warden.email }, // check if warden already exists
        { $setOnInsert: warden }, // insert only if not exists
        { upsert: true }
      );
    }

    console.log("✅ Dummy wardens seeded successfully");
    process.exit();
  } catch (error) {
    console.error("❌ Seeding error:", error.message);
    process.exit(1);
  }
};

seedWarden();
