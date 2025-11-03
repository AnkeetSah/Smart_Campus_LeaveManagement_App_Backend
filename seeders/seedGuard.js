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

    // List of guards to insert
    const guards = [
      {
        name: "Ajay Guard",
        employeeId: "G001",
        phone: "9876543210",
        email: "guard@demo.com",
        password: hashedPassword,
        role: "guard",
        firstLogin: true,
      },
      // You can add more guards here if needed
    ];

    for (const g of guards) {
      const exists = await Guard.findOne({ $or: [{ employeeId: g.employeeId }, { email: g.email }] });
      if (!exists) {
        await Guard.create(g);
        console.log(`✅ Guard ${g.name} inserted successfully`);
      } else {
        console.log(`⚠️ Guard ${g.name} already exists, skipping`);
      }
    }

    process.exit();
  } catch (error) {
    console.error("❌ Seeding error:", error.message);
    process.exit(1);
  }
};

seedGuards();
