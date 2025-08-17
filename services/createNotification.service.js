// services/notificationService.js
import Notification from "../models/Notification.js";
/**
 * Creates a new notification document in DB
 * @param {Object} data - notification data
 * @param {ObjectId} data.student - student _id who will receive this
 * @param {String} data.kind - type of notification ("leave" | "system" | "reminder")
 * @param {String} data.event - event type ("submitted" | "forwarded" | "approved" | "rejected" | "changes_requested" | "pending" | "reminder")
 * @param {String} data.message - readable text for UI
 * @param {String} data.redirectTo - frontend navigation path
 * @param {Object} [data.meta] - optional lightweight context
 */
export async function createNotification(data) {
  try {
    const notification = new Notification({
      student: data.student,
      kind: data.kind || "leave",
      event: data.event,
      message: data.message,
      redirectTo: data.redirectTo,
      notifiedBy: data.notifiedBy, // ✅ FIXED
      meta: data.meta || {},
    });

    return await notification.save();
  } catch (error) {
    console.error("Error creating notification:", error);
    throw new Error("Could not create notification");
  }
}



