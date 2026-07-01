import mongoose from "mongoose";

export const userSchema = new mongoose.Schema({
  name: {
    type: String,
    maxLength: [25, "Name can't be greater than 25 characters"],
  },
  email: {
    type: String,
    unique: true,
    required: true,
    match: [/.+\@.+\../, "Please enter a valid email"],
  },
  password: {
    type: String,
    require: true,
  },
  role: {
    type: String,
    enum: ["user", "admin"],
    default: "user",
  },
  profilePicture: {
    type: String,
    require: true,
  },
  createdAt: {
    type: String,
    default: () => Date.now(),
  },
  gender: {
    type: String,
    require: true,
  },
  avatar: {
    type: String,
    default: "",
  },
});
