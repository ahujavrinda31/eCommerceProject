import User from "../models/User.js";
import Category from "../models/Category.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import mongoose from "mongoose";
import path from "path";
import fs from "fs";

export const getProfile = async (req, res) => {
  if (!req.session.isLoggedIn) return res.redirect("/");

  try {
    const user = await User.findOne(
      { email: req.session.email },
      { password: 0 }
    );

    if (!user) return res.redirect("/");

    res.render("profile", { user });
  } catch (err) {
    console.error(err);
    res.status(500).send("Error loading profile");
  }
};

export const updateProfile = async (req, res) => {
  if (!req.session.isLoggedIn) {
    return res.json({ success: false, message: "Not logged in" });
  }

  const { name, phone, address } = req.body;
  if (!name || !phone || !address) {
    return res.json({
      success: false,
      message: "Name, phone and address are required",
    });
  }

  try {
    const updatedUser = await User.findOneAndUpdate(
      { email: req.session.email },
      {
        $set: {
          name: name.trim(),
          phone: phone.trim(),
          address: address.trim(),
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    req.session.name = updatedUser.name;

    res.json({
      success: true,
      user: {
        name: updatedUser.name,
        phone: updatedUser.phone,
        address: updatedUser.address,
      },
    });
  } catch (err) {
    console.error(err);
    res.json({
      success: false,
      message: "Database update failed",
    });
  }
};

export const addProduct=async(req,res)=>{
    try{
        let {categoryName,subcategoryName,name,price,quantity,description}=req.body;

        categoryName=categoryName.toLowerCase().trim();
        subcategoryName=subcategoryName.toLowerCase().trim();
        name=name.toLowerCase().trim();

        const category=await Category.findOne({name:categoryName});
        if(!category){
            return res.json({
                success:false,
                message:"Category does not exist"
            })
        }

        const subExists=category.subcategories.some((sub)=>sub.name==subcategoryName);

        if(!subExists){
            return res.json({
                success:false,
                message:"Subcategory does not exist in this category"
            })
        }

        const existingProduct=await Product.findOne({
            sellerId:req.session.userId,
            name,
            categoryId:category._id,
            subcategory:subcategoryName
        })

        if(existingProduct){
            return res.json({
                success:false,
                message:"Product already exists"
            })
        }

        const product=new Product({
            name,
            price,
            quantity,
            description,
            imagePath:`/uploads/products/${req.file.filename}`,
            sellerId:req.session.userId,
            categoryId:category._id,
            subcategory:subcategoryName
        })

        await product.save();

        res.json({
            success:true,
            message:"Product saved successfully"
        })
    }
    catch(err){
        console.error("Error adding product: ",err);
        res.status(500).json({success:false,message:"Server error"})
    }
}

export const getProducts=async(req,res)=>{
    try{
        const products=await Product.find({
            sellerId:req.session.userId
        })

        res.json({success:true,products})
    }
    catch(err){
        console.error(err);
        res.status(500).json({success:false});
    }
}

export const editProduct=async(req,res)=>{
    try{
        const {name,price,quantity,description}=req.body;
        const product=await Product.findById(req.params.id);

        if(!product){
            return res.json({success:false,message:"Product not found"});
        }

        product.name=name || product.name;
        product.price=price || product.price;
        product.quantity=quantity || product.quantity;
        product.description=description || product.description;

        if(req.file){
            const oldImagePath=path.join("public",product.imagePath);
            fs.unlink(oldImagePath,(err)=>{
                if(err) console.error("Error removing old image: ",err);
            })

            product.imagePath=`/uploads/products/${req.file.filename}`;
        }

        await product.save();

        res.json({success:true,message:"Product Updated",updated:product})
    }
    catch(err){
        console.error(err);
        res.status(500).json({success:false,message:"Server error"})
    }
}

export const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.json({ success: false, message: "Product not found" });

    const imagePath = path.join("public", product.imagePath);
    fs.unlink(imagePath, (err) => {
      if (err) console.error("Error removing image:", err);
    });

    await product.deleteOne();

    res.json({ success: true, message: "Product deleted" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const sellerViewOrders = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect("/");
    }

    if (!mongoose.isValidObjectId(req.session.userId)) {
      return res.render("sellerViewOrders", { orders: [] });
    }

    const sellerId = new mongoose.Types.ObjectId(
      String(req.session.userId)
    );

    const orders = await Order.find({
      "products.sellerId": sellerId
    }).sort({ createdAt: -1 });

    res.render("sellerViewOrders", { orders });
  } catch (err) {
    console.error(err);
    res.render("sellerViewOrders", { orders: [] });
  }
};