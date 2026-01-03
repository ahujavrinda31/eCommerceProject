import express from "express";
import { sendOTP, verifyOTP, loginScript, admin, user, seller, transporterRole, logout, forgotPasswordSentOtp, forgotPasswordVerifyOtp } from "../controllers/authController.js";

const router=express.Router();

router.get("/admin",admin);
router.get("/user",user);
router.get("/seller",seller);
router.get("/transporter",transporterRole);
router.post("/send-otp",sendOTP);
router.post("/verify-otp",verifyOTP);
router.post("/forgot-password/send-otp",forgotPasswordSentOtp);
router.post("/forgot-password/verify",forgotPasswordVerifyOtp);
router.post("/loginScript",loginScript);
router.post("/logout",logout);

export default router;