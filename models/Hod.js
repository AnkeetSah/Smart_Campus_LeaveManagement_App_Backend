import mongoose from "mongoose";

const hodSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
      required: true,
    }, branch: {
      type: String,
      required: true,
    },
    department: {
      type: String, // To match with faculty/student department
      required: true,
    },
    role: {
      type: String,
      enum: ["hod"],
      default: "hod",
    },
  },
  { timestamps: true }
);

const Hod = mongoose.model("Hod", hodSchema);
export default Hod;
