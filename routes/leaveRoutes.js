import express from "express";
import {
  submitLeaveApplication,
  getMyApplications,
  getLeaveById,
  getAllStudentLeaves,
  actionOnLeave,
  updateLeaveApplication
} from "../controllers/leaveController.js";
import protect from "../middleware/protect.js";
import upload from "../middleware/cloudinaryUpload.js";

const router = express.Router();


router.post("/", protect, upload.array("documents", 3), submitLeaveApplication);
router.put(  "/update/:id",  protect,  upload.array("documents", 3), updateLeaveApplication);

router.get("/my-applications", protect, getMyApplications);
router.get("/getAllStudentLeaves", protect, getAllStudentLeaves);
// leaveRoutes.js or wherever this route is
router.post("/actionOnLeave", protect, actionOnLeave);

router.get("/:id", protect, getLeaveById);

export default router;
