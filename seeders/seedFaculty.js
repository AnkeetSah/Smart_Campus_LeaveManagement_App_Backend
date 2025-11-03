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

    // ✅ Insert new dummy faculty without removing existing ones
    await Faculty.insertMany([
      {
        name: "Rajeev Sharma",
        email: "faculty2@demo.com",
        password: hashedPassword,
        department: "CSE", // required
        branch: "CSE",     // required
        section: "D",      // valid enum
        role: "faculty",   // valid enum
        firstLogin: true,  // required
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
