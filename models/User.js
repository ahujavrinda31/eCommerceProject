import { Schema, model } from "mongoose";

const userSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, unique: true },
  phone: {
    type: String,
    required: true,
  },
  role: { type: String, enum: ["user", "admin", "seller", "transporter"] },
  address: {
    type: String,
    required: function () {
      this.role != "admin";
    },
  },
  vehicleNo: {
    type: String,
    sparse: true,
    required: function () {
      return this.role == "transporter";
    },
  },
  gstNo: {
    type: String,
    sparse: true,
    minLength: 15,
    maxLength: 15,
    required: function () {
      return this.role == "seller";
    },
  },
  status: {
    type: String,
    enum: ["approved", "pending"],
    default: function () {
      if (this.role == "seller" || this.role == "transporter") {
        return "pending";
      }
      return undefined;
    },
  },
});

export default model("User", userSchema);
