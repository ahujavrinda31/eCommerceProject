import express from "express";
import { getProfile, updateProfile, addToCart, getCart, updateCart, checkout, getOrders, placeOrder, cancelOrder, buyNow, getCategorySuggestions } from "../controllers/userController.js";

const router=express.Router();

const isUser=(req,res,next)=>{
    if(req.session.role!="user"){
        return res.status(403).send("Access Denied");
    }
    next();
}

router.get("/profile",isUser,getProfile);
router.get("/cart",isUser,getCart);
router.get("/checkout/:id",isUser,checkout);
router.get("/orders",isUser,getOrders);
router.get("/category-suggestions", isUser,getCategorySuggestions);
router.post("/update-profile",updateProfile);
router.post("/add-to-cart",addToCart);
router.post("/update-cart",updateCart);
router.post("/place-order",placeOrder);
router.post("/cart-buy-now",buyNow);
router.delete("/cancel-order/:id",cancelOrder);

export default router;