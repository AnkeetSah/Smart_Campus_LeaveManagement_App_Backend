import mongoose from "mongoose";

const leaveApplicationSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
     section: {
      type: String,
      enum: ['A', 'B', 'C', 'D'], // You can expand this list if needed
      default: 'A',
      required: true,
    },
    hostel: {
      name: { type: String },
      roomNumber: { type: String },
    },
    addressDuringLeave:{
       type:String
    },
    currentAttendance: {
      type: Number,
      trim: true,
    },
    attendanceAfterLeave: {
      type: Number,
      trim: true,
    },

    reason: {
      type: String,
      required: true,
      trim: true,
    },

    fromDate: {
      type: Date,
      required: true,
    },
    toDate: {
      type: Date,
      required: true,
    },

    leaveType: {
      type: String,
      enum: ["medical", "personal", "emergency", "other"],
      required: true,
    },

  decisionBy: {
  faculty: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "Faculty" },
    name: { type: String },
    status: { type: String, enum: ["pending", "approved", "rejected","changes_requested"], default: "pending" },
    comment: { type: String, default: "" },
    decidedAt: { type: Date },
  },
  hod: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "Hod" },
    name: { type: String },
    status: { type: String, enum: ["pending", "approved", "rejected","changes_requested"], default: "pending" },
    comment: { type: String, default: "" },
    decidedAt: { type: Date },
  },
  warden: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: "Warden" },
    name: { type: String },
    status: { type: String, enum: ["pending", "approved", "rejected","changes_requested"], default: "pending" },
    comment: { type: String, default: "" },
    decidedAt: { type: Date },
  },
},

    finalStatus: {
      type: String,
      enum: ["pending", "approved", "rejected"],
      default: "pending",
    },
    

    // Optional Comments by each authority
    


    // Supporting documents (e.g., PDFs, Images)
    documents: {
      type: [String],
      default: [],
    },

    // QR scan tracking (used by guard)
    scanned: {
      type: Boolean,
      default: false,
    },
    scannedAt: {
      type: Date,
    },
    scannedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Guard",
    },
  },
  { timestamps: true }
);

// Register the model
const LeaveApplication = mongoose.model("LeaveApplication", leaveApplicationSchema);
export default LeaveApplication;
