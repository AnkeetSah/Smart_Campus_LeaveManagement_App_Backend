import express from "express";
import { generatePassword } from "../utils/generatePassword.js";
import { sendCredentialsEmail } from "../services/email.service.js";
import bcrypt from "bcryptjs";
import Hod from '../models/Hod.js';
import Faculty from '../models/Faculty.js';
import Student from '../models/Student.js';
import Warden from '../models/Warden.js';
import Guard from '../models/Guard.js';

const router = express.Router();

const roleModelMap = {
  hod: Hod,
  faculty: Faculty,
  student: Student,
  warden: Warden,
  guard: Guard,
};

// Default templates for each role
const roleTemplates = {
  student: {
    branch: "CSE",
    section: "A",
    rollNumber: () => `CSE${Date.now()}${Math.floor(Math.random() * 1000)}`,
    program: "B.Tech",
    semester: 7,
    semesterStartDate: "2024-07-01T00:00:00.000+00:00",
    semesterEndDate: "2024-12-15T00:00:00.000+00:00",
  },
  hod: {
    branch: "CSE",
    department: "Computer Science",
  },
  faculty: {
    branch: "CSE",
    section: "A",
    department: "Computer Science",
  },
  warden: {
    hostel: "Hostel A",
  },
  guard: {},
};

router.post('/auto', async (req, res) => {
  try {
    const { name, email, gender, role } = req.body;
    const Model = roleModelMap[role];
    if (!Model) return res.status(400).send({ error: "Invalid role" });

    const password = generatePassword(name, email);
    const hashedPassword = await bcrypt.hash(password, 10);

    // Build user data by combining common fields + role template
    const template = roleTemplates[role] || {};
    const userData = {
      name,
      email,
      role,
      password: hashedPassword,
      ...(role === "student" ? { gender } : {}), // only students have gender
      ...Object.keys(template).reduce((acc, key) => {
        acc[key] = typeof template[key] === "function" ? template[key]() : template[key];
        return acc;
      }, {}),
    };

    const userDoc = new Model(userData);
    await userDoc.save();

    await sendCredentialsEmail({ email, name, password, role });

    res.send(userData);
  } catch (err) {
    console.error(err);
    res.status(500).send({ error: "Failed to create user" });
  }
});

export default router;
