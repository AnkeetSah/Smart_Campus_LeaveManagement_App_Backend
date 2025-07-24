// seeders/seedFaculty.js

import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import connectDB from "../config/db.js";
import Faculty from "../models/Faculty.js";

dotenv.config();
// ✅ Connect to MongoDB
await connectDB();

const seedFaculty = async () => {
  try {
    const hashedPassword = await bcrypt.hash("123456", 10); // default password

    

    // ✅ Insert dummy faculty
    await Faculty.insertMany([
      {
        name: "Rajeev Sharma",
        email: "faculty2@demo.com",
        password: hashedPassword,
        department: "CSE",
        section: "B",
        role: "faculty",
      },
      {
        name: "Ravi ECE Faculty",
        email: "faculty3@demo.com",
        password: hashedPassword,
        department: "ECE",
        section: "B",
        role: "faculty",
      },
    ]);

    console.log("✅ Dummy faculty inserted successfully");
    process.exit();
  } catch (error) {
    console.error("❌ Seeding error:", error.message);
    process.exit(1);
  }
};

seedFaculty();
