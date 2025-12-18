import { Schema, model } from "mongoose";

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, unique:true },
  phone: {
    type: String,
    required: [true, 'Phone number is required.'],
    minLength: [10, 'Phone number must be exactly 10 digits.'],
    maxLength: [10, 'Phone number must be exactly 10 digits.'],
    match: [/^\d{10}$/, 'Phone number must contain only digits (0-9).'] 
  },
  address: { type: String, required:true },

  admin: { type: String, enum: ["yes", "no"], default: "no" },
});

export default model("User", userSchema);
