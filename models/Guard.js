import mongoose from "mongoose";
const guardSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
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
  }, firstLogin: {
  type: Boolean,
  default: true,
  required: true,
},

  // 🆕 Array of scanned leaves
 scannedLeaves: [
  new mongoose.Schema({
    leaveId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'LeaveApplication',
      required: true
    },
    count: {
      type: Number,
      default: 1
    },
    lastScannedAt: {
      type: Date,
      default: Date.now
    }
  }, { _id: false }) // no auto _id on subdocs
]
,


  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Guard = mongoose.model("Guard", guardSchema);
export default Guard;
