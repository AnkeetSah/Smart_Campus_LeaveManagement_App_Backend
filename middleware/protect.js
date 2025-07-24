import jwt from "jsonwebtoken";
import Student from "../models/Student.js";
import Faculty from "../models/Faculty.js";
import Hod from "../models/Hod.js";
import Warden from "../models/Warden.js";
import Guard from "../models/Guard.js";

const roleModelMap = {
  student: Student,
  faculty: Faculty,
  hod: Hod,
  warden: Warden,
  guard: Guard,
};

const protect = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const { userId, role } = decoded;

    const Model = roleModelMap[role];
    if (!Model) {
      return res.status(400).json({ message: "Invalid role in token" });
    }

    const user = await Model.findById(userId).select("-password");
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    console.log(user)
    req.user = user;
    next();
  } catch (error) {
    console.error(error);
    res.status(401).json({ message: "Not authorized, invalid token" });
  }
};

export default protect;
