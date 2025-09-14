import { Schema, models, model } from "mongoose";

const userSchema = new Schema(
  {
    name: String,
    email: { type: String, unique: true },
  },
  { timestamps: true }
);

// Prevent model overwrite upon hot-reload
const User = models.User || model("User", userSchema);

export default User;
