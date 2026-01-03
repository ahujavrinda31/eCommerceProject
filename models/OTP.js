import { Schema, model } from "mongoose";

const OtpSchema=new Schema({
    email:String,
    otp:String,
    expiresAt:Date
})

export default model("Otp",OtpSchema);