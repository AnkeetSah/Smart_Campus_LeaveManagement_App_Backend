import express from "express";
import { getMe } from "../controllers/userController.js";
import protect from "../middleware/protect.js";

const router = express.Router();
 console.log('hello user')
// Add this route
router.get("/", protect, getMe);    // ✅


export default router;
