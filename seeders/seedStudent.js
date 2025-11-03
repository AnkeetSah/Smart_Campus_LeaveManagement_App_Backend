// seeders/seedStudents.js
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

    // 🔄 Upsert students: update if email exists, otherwise insert
    const students = [
      {
        name: "Pooja Student",
        email: "student2@demo.com",
        password: hashedPassword,
        branch: "CSE",
        section: "A",
        rollNumber: "CSE2021A002",
        program: "B.Tech",
        semester: 5,
        gender: "female",
        hostel: {
          name: "Hostel B",
          roomNumber: "102",
        },
        semesterStartDate: new Date("2024-07-01"),
        semesterEndDate: new Date("2024-12-15"),
        firstLogin: true,
      },
      {
        name: "Ravi Student",
        email: "student3@demo.com",
        password: hashedPassword,
        branch: "CSE",
        section: "D",
        rollNumber: "CSE2021B001",
        program: "B.Tech",
        semester: 7,
        gender: "male",
        hostel: {
          name: "Hostel D",
          roomNumber: "103",
        },
        semesterStartDate: new Date("2024-07-01"),
        semesterEndDate: new Date("2024-12-15"),
        firstLogin: true,
      },
    ];

    for (const student of students) {
      await Student.updateOne(
        { email: student.email }, // check by email
        { $setOnInsert: student }, // insert only if not exists
        { upsert: true }
      );
    }

    console.log("✅ Dummy students seeded successfully");
    process.exit();
  } catch (error) {
    console.error("❌ Seeding error:", error.message);
    process.exit(1);
  }
};

seedStudents();
