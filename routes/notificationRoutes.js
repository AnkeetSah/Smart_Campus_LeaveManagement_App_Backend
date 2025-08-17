import express from 'express'
import {saveSubscription} from '../controllers/notificationController.js'
import Notification from '../models/Notification.js';
import protect from '../middleware/protect.js';
const router=express.Router()

// Route to handle push subscription from frontend
router.post('/subscribe', saveSubscription);

router.get("/", protect, async (req, res) => {
  try {
    const notifications = await Notification.find({ student: req.user._id })
      .sort({ createdAt: -1 });
   
    res.status(200).json(notifications);
  } catch (error) {
    res.status(500).json({ message: "Error fetching notifications", error });
  }
});
router.post("/update", async (req, res) => {
  try {
    const { id } = req.body;

    const updatedNotification = await Notification.findByIdAndUpdate(
      id,
      { isRead: true },
      { new: true } // returns updated document
    );

    if (!updatedNotification) {
      return res.status(404).json({ message: "Notification not found" });
    }

    res.json({ message: "Notification updated", notification: updatedNotification });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});


export default router;