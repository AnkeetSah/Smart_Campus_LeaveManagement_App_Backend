import mongoose from "mongoose";

const studentSchema = new mongoose.Schema(
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
      trim: true,
      index: true // Ensure email is indexed for faster lookups
    },
    password: {
      type: String,
      required: true,
    },
    branch: {
      type: String,
      required: true,
    },
    section: {
      type: String,
      enum: ['A', 'B', 'C', 'D'], // You can expand this list if needed
      default: 'A',
      required: true,
    },
    rollNumber: {
      type: String,
      required: true,
      unique: true,
    },
    program: {
      type: String,
      required: true,
    },
    semester: {
      type: Number,
      required: true,
      min: 1,
      max: 8,
    },
    gender: {
      type: String,
      enum: ["male", "female", "other"],
      required: true,
    },
    hostel: {
      name: { type: String },
      roomNumber: { type: String },
    },
    role: {
      type: String,
      default: "student",
    },
    semesterStartDate: {
      type: Date,
      required: true
    },
    semesterEndDate: {
      type: Date,
      required: true
    },
    firstLogin: {
      type: String,
      default: "true",
      required: true,
    }, 
    notificationCount: {
      type: Number,
      default: 0
    }



  },
  { timestamps: true }
);

const Student = mongoose.model("Student", studentSchema);
export default Student;
