import Student from "../models/Student.js";
import Faculty from "../models/Faculty.js";
import Hod from "../models/Hod.js";
import Warden from "../models/Warden.js";
import Guard from "../models/Guard.js";
import bcrypt from "bcryptjs";
import generateToken from "../utils/generateToken.js";

const roleModelMap = {
  student: Student,
  faculty: Faculty,
  hod: Hod,
  warden: Warden,
  guard: Guard,
};

// ✅ Login Controller
export const loginUser = async (req, res) => {
  const { email, password, role } = req.body;

  // Basic Validation
  if (!email || !password || !role) {
    return res.status(400).json({ message: "Email, password, and role are required." });
  }

  const Model = roleModelMap[role];
  if (!Model) {
    return res.status(400).json({ message: "Invalid user role." });
  }

  try {
    const user = await Model.findOne({ email });
    if (!user) return res.status(404).json({ message: "User not found" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ message: "Incorrect password" });

    const token = generateToken(user._id, role);
    console.log("token", token);
    // ✅ Set JWT in HTTP-only cookie
    res.cookie("token", token, {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  secure: process.env.NODE_ENV === "production", // must be true with SameSite=None
});

    


    res.status(200).json({
      message: "Login successful",
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role:user.role,
        section:user.section,
        department:user.department
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error" });
  }
};

// ✅ Logout Controller
export const logoutUser = (req, res) => {
  res.clearCookie("token", {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
  });
  res.status(200).json({ message: "Logged out successfully" });
};
