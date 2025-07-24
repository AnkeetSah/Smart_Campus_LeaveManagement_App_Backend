// seeders/seedUsers.js

import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import connectDB from "../config/db.js";

import Student from "../models/Student.js";
import Faculty from "../models/Faculty.js";
import Hod from "../models/Hod.js";
import Warden from "../models/Warden.js";

dotenv.config();
await connectDB();


const seedUsers = async () => {
  try {
    const hashedPassword = await bcrypt.hash("123456", 10); // default password for all

    // Clear existing
    await Student.deleteMany();
    await Faculty.deleteMany();
    await Hod.deleteMany();
    await Warden.deleteMany();

    // Insert dummy students
    await Student.insertMany([
  {
    name: "Ankit Student",
    email: "student1@demo.com",
    password: hashedPassword,
    rollNumber: "CSE2021A001",
    department: "CSE",
    semester: 5,
    gender: "male",
    section:"A",
    hostel: {
      name: "Hostel A",
      roomNumber: "101",
    },
    semesterStartDate: new Date("2024-07-01"), // or today’s date
    semesterEndDate: new Date("2024-12-15"),   // adjust as per your semester
  },
]);

    // Insert dummy faculty
    await Faculty.insertMany([
      {
        name: "Ravi Faculty",
        email: "faculty1@demo.com",
        password: hashedPassword,
        department: "CSE",
        section: "A",
      },
    ]);

    // Insert dummy HOD
    await Hod.insertMany([
      {
        name: "Dr. HOD",
        email: "hod1@demo.com",
        password: hashedPassword,
        department: "CSE",
      },
    ]);

    // Insert dummy warden
    await Warden.insertMany([
      {
        name: "Suresh Warden",
        email: "warden1@demo.com",
        password: hashedPassword,
        hostel: "Hostel A",
      },
    ]);

    console.log("✅ Dummy users inserted with hashed passwords");
    process.exit();
  } catch (error) {
    console.error("❌ Seeding error:", error.message);
    process.exit(1);
  }
};

seedUsers();
