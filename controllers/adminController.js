// controllers/adminController.js
import { addUsers } from "../services/admin.service.js";

export const addUser = async (req, res) => {
  try {
    const result = await addUsers(req.body); // destructured object: { users, role }
    res.status(200).json({ message: "Users added", result });
  } catch (error) {
    console.error("Error in addUser:", error);
    res.status(500).json({ message: "Server error" });
  }
};
