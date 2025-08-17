import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    // Who receives the notification
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },
    notifiedBy:{
       type:String,
       
    },

    // What kind of notification this is
    kind: {
      type: String,
     
    },

    // Event for leave workflow (used for icon/color on UI)
    event: {
      type: String,
      enum: ["submitted", "forwarded", "approved", "rejected", "changes_requested", "pending", "reminder"],
      required: true,
    },

    // Readable text to show in the notification row
    message: {
      type: String,
      
      trim: true,
    },

    // Backend decides exactly where the frontend should navigate
    // e.g. "/dashboard/student/status?leaveId=689f..." or "/dashboard/student/history?leaveId=689f..."
    redirectTo: {
      type: String,
      required: true,
    },

    // Read state for bell badge
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },

    // Optional context (no DB relationship)
    meta: {
      leaveType: { type: String, enum: ["medical", "personal", "emergency", "other"] },
      fromDate: Date,
      toDate: Date,
      section: { type: String, enum: ["A", "B", "C", "D"] },
      // add lightweight fields you want to render without extra DB lookups
    },
  },
  { timestamps: true }
);

// Useful compound index for inbox queries
notificationSchema.index({ student: 1, isRead: 1, createdAt: -1 });

export default mongoose.model("Notification", notificationSchema);
