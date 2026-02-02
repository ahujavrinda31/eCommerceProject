import express from "express";
import { getProfile, updateProfile, addToCart, getCart, updateCart, checkout, getOrders, placeOrder, cancelOrder, buyNow, searchProducts, removeFromCart, userCartPage, getUserCartData, cartPlaceOrder, getProductDetails } from "../controllers/userController.js";

const router=express.Router();

const isUser=(req,res,next)=>{
    if(req.session.role!="user"){
        return res.status(403).send("Access Denied");
    }
    next();
}

router.get("/profile",isUser,getProfile);
router.get("/cart",isUser,userCartPage);
router.get("/cart-data",isUser,getUserCartData);
router.get("/checkout/:id",isUser,checkout);
router.get("/orders",isUser,getOrders);
router.get("/search-products", isUser,searchProducts);
router.get("/product/:id",getProductDetails);
router.post("/update-profile",updateProfile);
router.post("/add-to-cart",addToCart);
router.post("/update-cart",updateCart);
router.post("/place-order",placeOrder);
router.post("/cart-buy-now",buyNow);
router.delete("/cancel-order/:id",cancelOrder);
router.delete("/remove-from-cart",removeFromCart);
router.post("/cart-place-order",cartPlaceOrder);

export default router;