import express from "express";
import { addCategory, addSubcategory, addProduct, getProducts, editProduct, deleteProduct, sellerViewOrders, editCategory, editSubcategory, getProfile, updateProfile } from "../controllers/sellerController.js";
import { upload } from "../middlewares/upload.js";
import Product from "../models/Product.js";

const router=express.Router();

const isSeller=(req,res,next)=>{
    if(req.session.role!="seller"){
        return res.status(403).json({message:"Access Denied"});
    }
    next();
}

router.get("/product/:id", async (req, res) => {
  const product = await Product.findById(req.params.id);
  res.json(product);
});
router.get("/profile",isSeller,getProfile);
router.get("/seller-products",isSeller,getProducts);
router.get("/sellerViewOrders",isSeller,sellerViewOrders);
router.put("/edit-product/:id", upload.single("image"), editProduct);
router.put("/edit-category",editCategory);
router.put("/edit-subcategory",editSubcategory);
router.post("/update-profile",updateProfile);
router.post("/addCategory",addCategory);
router.post("/addsubcategory",addSubcategory);
router.post("/add-product",upload.single("image"),addProduct);
router.delete("/delete-product/:id", deleteProduct);

export default router;