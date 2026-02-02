import express from "express";
import { adminUsersPage,deleteUser, approveUser, rejectUser, viewAllProducts, deleteProductByAdmin, viewOrders, getAvailableTransporters, assignTransporter, addCategory, addSubcategory, editCategory, editSubcategory } from "../controllers/adminController.js";

const router=express.Router();

const isAdmin=(req,res,next)=>{
    if(req.session.role!="admin"){
        return res.status(403).send("Access Denied");
    }
    next();
}


router.get("/products",isAdmin,viewAllProducts);
router.get("/view-orders", isAdmin,viewOrders);
router.get("/users",isAdmin,adminUsersPage);
router.get("/available-transporters", isAdmin, getAvailableTransporters);
router.post("/assign-transporter", assignTransporter);
router.post("/addCategory",addCategory);
router.post("/addsubcategory",addSubcategory);
router.put("/edit-category",editCategory);
router.put("/edit-subcategory",editSubcategory);
router.delete("/product/:id",deleteProductByAdmin);
router.delete("/users/:id",deleteUser);
router.post("/requests/:id/approve", approveUser);
router.post("/requests/:id/reject", rejectUser);

export default router;