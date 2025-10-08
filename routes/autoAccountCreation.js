import express from "express";
import { generatePassword } from "../utils/generatePassword.js";
import bcrypt from "bcryptjs";
import Hod from '../models/Hod.js';
import Faculty from '../models/Faculty.js';
import Student from '../models/Student.js';
import Warden from '../models/Warden.js';
import Guard from '../models/Guard.js';
import Subscription from "../models/subscriptionModel.js";
import webpush from "../config/pushConfig.js";

const router = express.Router();

// Map roles to models
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

    // Generate password and hash
    const password = generatePassword(name, email);
    const hashedPassword = await bcrypt.hash(password, 10);

    // Build user data
    const template = roleTemplates[role] || {};
    const userData = {
      name,
      email,
      role,
      password: hashedPassword,
      ...(role === "student" ? { gender } : {}),
      ...Object.keys(template).reduce((acc, key) => {
        acc[key] = typeof template[key] === "function" ? template[key]() : template[key];
        return acc;
      }, {}),
    };

    // Save user
    const userDoc = new Model(userData);
    await userDoc.save();

    // 🔔 Send push notification to admin only
    const adminId = "688a561e32c6332da113fffb";
    const adminSubs = await Subscription.find({ userId: adminId });

    if (adminSubs.length) {
      const payload = {
        title: "New User Created",
        message: `${userData.name} (${userData.role}) has been added.`,
        data: { userId: userDoc._id },
      };

     adminSubs.forEach(async (sub) => {
  try {
    await webpush.sendNotification(sub.subscription, JSON.stringify(payload));
  } catch (err) {
    console.error("Push error", err);
    // Remove invalid subscriptions
    if (err.statusCode === 410 || err.statusCode === 404) {
      await Subscription.deleteOne({ _id: sub._id });
      console.log("Removed expired subscription:", sub._id);
    }
  }
});

    }

    res.status(201).json({ message: "User created successfully", user: userData });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to create user" });
  }
});

export default router;
