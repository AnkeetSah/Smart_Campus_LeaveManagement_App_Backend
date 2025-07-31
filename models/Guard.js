import mongoose from "mongoose";
const guardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  employeeId: {
    type: String,
    required: true,
    unique: true,
  },
  phone: {
    type: String,
  },
  email: {
    type: String,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  role: {
    type: String,
    default: 'guard',
  },firstLogin: {
      type: String,
      default: "true",
      required: true,
    },

  // 🆕 Array of scanned leaves
  scannedLeaves: [
    {
      leaveId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'LeaveApplication',
      },
      scannedAt: {
        type: Date,
        default: Date.now,
      },
    }
  ],

  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Guard = mongoose.model("Guard", guardSchema);
export default Guard;
