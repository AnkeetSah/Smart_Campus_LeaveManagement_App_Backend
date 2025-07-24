// seeders/seedGuards.js

import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import connectDB from "../config/db.js";
import Guard from "../models/Guard.js";

dotenv.config();
// ✅ Connect to MongoDB
await connectDB();

const seedGuards = async () => {
  try {
    const hashedPassword = await bcrypt.hash("123456", 10); // default password

    // 🔄 Clear existing guards
    await Guard.deleteMany();

    // ✅ Insert dummy guards
    await Guard.insertMany([
      {
        name: "Ajay Guard",
        employeeId: "G001",
        phone: "9876543210",
        email: "guard1@demo.com",
        password: hashedPassword,
      },
      {
        name: "Sunita Guard",
        employeeId: "G002",
        phone: "8765432109",
        email: "guard2@demo.com",
        password: hashedPassword,
      },
    ]);

    console.log("✅ Dummy guards inserted successfully");
    process.exit();
  } catch (error) {
    console.error("❌ Seeding error:", error.message);
    process.exit(1);
  }
};

seedGuards();
