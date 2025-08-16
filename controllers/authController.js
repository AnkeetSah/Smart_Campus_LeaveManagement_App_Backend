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
   
    // ✅ Set JWT in HTTP-only cookie
    res.cookie("token", token, {
  httpOnly: true,
  sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
  secure: process.env.NODE_ENV === "production", 
});

    
    // ✅ Return user data without password
    user.password = undefined; // Remove password from response
   

    res.status(200).json({
      message: "Login successful",
      user: user,
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
    sameSite: process.env.NODE_ENV === "production" ? "None" : "Lax",
    secure: process.env.NODE_ENV === "production",
  });
  res.status(200).json({ message: "Logged out successfully" });
};






export const ChangePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const Model = roleModelMap[req.user.role];

    const userDoc = await Model.findOne({ email: req.user.email });
    if (!userDoc) {
      return res.status(404).json({ message: "User not found" });
    }

    const isMatch = await bcrypt.compare(oldPassword, userDoc.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Old password is incorrect" });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    userDoc.password = hashedPassword;
    userDoc.firstLogin = "false"; 
    await userDoc.save();         

    res.status(200).json({ message: "Password updated successfully" });
  } catch (error) {
    console.error("Error changing password:", error);
    res.status(500).json({ message: "Something went wrong" });
  }
};

