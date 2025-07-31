import express from "express";
import { ChangePassword } from "../controllers/authController.js";
import protect from "../middleware/protect.js";
// Importing the ChangePassword controller
const router=express.Router();

router.post('/password',protect,ChangePassword)

export default router;