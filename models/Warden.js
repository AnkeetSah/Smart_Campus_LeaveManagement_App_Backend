import mongoose from "mongoose";

const wardenSchema = new mongoose.Schema(
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
    hostel: {
      type: String, // Example: "Hostel A", "Block B"
      required: true,
    },
    role: {
      type: String,
      enum: ["warden"],
      default: "warden",
    }, firstLogin: {
  type: Boolean,
  default: true,
  required: true,
},
  },
  { timestamps: true }
);

const Warden = mongoose.model("Warden", wardenSchema);
export default Warden;
