import dotenv from "dotenv";
import bcrypt from "bcryptjs";
import connectDB from "../config/db.js";
import Student from "../models/Student.js";

dotenv.config();

// ✅ Connect to MongoDB
await connectDB();

const seedStudents = async () => {
  try {
    const hashedPassword = await bcrypt.hash("123456", 10); // default password

    // ✅ Insert dummy students
    await Student.insertMany([
      {
        name: "Pooja Student",
        email: "student2@demo.com",
        password: hashedPassword,
        rollNumber: "CSE2021A002",
        department: "CSE",
        semester: 5,
        gender: "female",
        hostel: {
          name: "Hostel B",
          roomNumber: "102",
        },
        semesterStartDate: new Date("2024-07-01"),
        semesterEndDate: new Date("2024-12-15"),
      },
      {
        name: "Ravi Student",
        email: "student3@demo.com",
        password: hashedPassword,
        rollNumber: "ECE2021B001",
        department: "ECE",
        semester: 5,
        gender: "male",
        hostel: {
          name: "Hostel C",
          roomNumber: "103",
        },
        semesterStartDate: new Date("2024-07-01"),
        semesterEndDate: new Date("2024-12-15"),
      }
    ]);

    console.log("✅ Dummy students inserted successfully");
    process.exit();
  } catch (error) {
    console.error("❌ Seeding error:", error.message);
    process.exit(1);
  }
};

seedStudents();
