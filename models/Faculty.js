import mongoose from "mongoose";

const facultySchema = new mongoose.Schema(
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
    },
    department: {
      type: String,
      required: true,
    },
    section: {
      type: String,
      enum: ['A', 'B', 'C', 'D'], 
      default: 'A',
      required: true,
    },
    role: {
      type: String,
      enum: ["faculty"],
      default: "faculty",
    },
  },
  { timestamps: true }
);

const Faculty = mongoose.model("Faculty", facultySchema);
export default Faculty;
