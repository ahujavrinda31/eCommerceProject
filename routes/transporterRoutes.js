import express from "express";
import { updateOrderStatus, getProfile, updateProfile } from "../controllers/trasnporterController.js";

const router=express.Router();

const isTransporter=(req,res,next)=>{
    if(req.session.role!="transporter"){
        return res.status(403).send("Access Denied");
    }
    next();
}

router.get("/profile",isTransporter,getProfile);
router.post("/update-profile",updateProfile);
router.post("/update-order-status",updateOrderStatus);

export default router;