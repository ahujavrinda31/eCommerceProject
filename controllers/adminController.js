import User from "../models/User.js";
import Product from "../models/Product.js";
import Order from "../models/Order.js";
import Cart from "../models/Cart.js";
import Category from "../models/Category.js";
import nodemailer from "nodemailer";
import fs from "fs";
import path from "path";
import dotenv from "dotenv";
dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const adminUsersPage = async (req, res) => {
  try {
    const users = await User.find({ role: { $ne: "admin" } }, { password: 0 });
    res.render("adminUsers", {
      name: req.session.name,
      users,
    });
  } catch (err) {
    console.error("Error fetching users: ", err);
    res.status(500).send("Server error");
  }
};

export const deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(id);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    if (user.role == "seller") {
      const sellerProducts = await Product.find({ sellerId: id }, { _id: 1 });
      const sellerProductIds = sellerProducts.map((p) => p._id);

      await Product.deleteMany({ sellerId: id });

      if (sellerProductIds.length > 0) {
        await Cart.updateMany(
          {},
          {
            $pull: {
              products: { productId: { $in: sellerProductIds } },
            },
          },
        );
      }

      await Order.updateMany(
        {
          status: { $nin: ["Out for delivery", "Delivered"] },
          "products.productId": { $in: sellerProductIds },
        },
        {
          $pull: {
            products: { productId: { $in: sellerProductIds } },
          },
        },
      );
      await Order.deleteMany({
        status: { $nin: ["Out for delivery", "Delivered"] },
        products: { $size: 0 },
      });
    }
    await User.findByIdAndDelete(id);
    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting user: ", err);
    res.status(500).json({ success: false });
  }
};

export const approveUser = async (req, res) => {
  const user = await User.findById(req.params.id);

  user.status = "approved";
  await user.save();

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: "Account Approved",
    text: "Your account has been approved. You can login now.",
  };
  await transporter.sendMail(mailOptions);

  res.json({ success: true, message: "User approved" });
};

export const rejectUser = async (req, res) => {
  const user = await User.findById(req.params.id);

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: user.email,
    subject: "Account Rejected",
    text: "Your account has been rejected.",
  };
  await transporter.sendMail(mailOptions);

  await User.deleteOne({ _id: user._id });

  res.json({ success: true, message: "User rejected & removed" });
};

export const adminPage = async (req, res) => {
  try {
    const pendingUsers = await User.find({
      role: { $in: ["seller", "transporter"] },
      status: "pending",
    });

    res.render("admin", {
      name: req.session.name,
      users: pendingUsers,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

export const addCategory = async (req, res) => {
  try {
    const name = req.body.name.toLowerCase().trim();

    const existingCategory = await Category.findOne({ name });

    if (existingCategory) {
      return res.json({ exists: true });
    }

    await Category.create({ name });

    res.json({ success: true });
  } catch (err) {
    console.error("Error adding category: ", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const addSubcategory = async (req, res) => {
  try {
    let { categoryName, subcategoryName } = req.body;

    categoryName = categoryName.toLowerCase().trim();
    subcategoryName = subcategoryName.toLowerCase().trim();

    const category = await Category.findOne({ name: categoryName });

    if (!category) {
      return res.json({
        success: false,
        message: "Category does not exist",
        type: "not_exists",
      });
    }

    const exists = category.subcategories.some(
      (sub) => sub.name == subcategoryName,
    );

    if (exists) {
      return res.json({
        success: false,
        type: "exists",
        message: "Subcategory already exists, you can use it.",
      });
    }

    category.subcategories.push({ name: subcategoryName });
    await category.save();

    return res.json({
      success: true,
      message: "Subcategory added successfully",
    });
  } catch (err) {
    console.error("Error adding subcategory: ", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const editCategory = async (req, res) => {
  try {
    let { oldName, newName } = req.body;

    oldName = oldName.toLowerCase().trim();
    newName = newName.toLowerCase().trim();

    const category = await Category.findOne({ name: oldName });
    if (!category) {
      return res.json({ success: false, message: "Category not found" });
    }

    category.name = newName;
    await category.save();

    res.json({ success: true, message: "Category updated successfully" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

export const editSubcategory = async (req, res) => {
  try {
    let { categoryName, oldSub, newSub } = req.body;

    categoryName = categoryName.toLowerCase().trim();
    oldSub = oldSub.toLowerCase().trim();
    newSub = newSub.toLowerCase().trim();

    const category = await Category.findOne({ name: categoryName });
    if (!category) {
      return res.json({ success: false, message: "Category not found" });
    }

    const sub = category.subcategories.find((s) => s.name === oldSub);
    if (!sub) {
      return res.json({ success: false, message: "Subcategory not found" });
    }

    sub.name = newSub;
    await category.save();

    await Product.updateMany(
      {
        categoryId: category._id,
        subcategory: oldSub,
      },
      { $set: { subcategory: newSub } },
    );

    res.json({ success: true, message: "Subcategory updated everywhere" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};

export const viewAllProducts = async (req, res) => {
  try {
    const products = await Product.find()
      .populate("sellerId", "name")
      .populate("categoryId", "name");

    res.render("adminProducts", {
      products,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};

export const deleteProductByAdmin = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }

    const imagePath = path.join(process.cwd(), "public", product.imagePath);

    fs.unlink(imagePath, (err) => {
      if (err) {
        if (err.code != "ENOENT") {
          console.error("Error deleting image: ", err);
        }
      }
    });

    await product.deleteOne();

    res.json({ success: true, message: "Product deleted successfully" });
  } catch (err) {
    console.error("Error deleting product: ", err);
    res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const viewOrders = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect("/");
    }
    const orders = await Order.find().sort({ createdAt: -1 });
    res.render("adminViewOrders", { orders });
  } catch (err) {
    console.error("Error fetching orders: ", err);
    res.status(500).send("Failed to load orders");
  }
};

export const getAvailableTransporters = async (req, res) => {
  try {
    const transporters = await User.find(
      { role: "transporter" },
      { password: 0 },
    ).lean();

    const availableTransporters = [];

    for (const transporter of transporters) {
      const activeOrdersCount = await Order.countDocuments({
        transporterId: transporter._id,
        status: { $in: ["Placed", "Out for delivery"] },
      });

      if (activeOrdersCount < 5) {
        availableTransporters.push({
          _id: transporter._id,
          name: transporter.name,
          email: transporter.email,
          currentOrders: activeOrdersCount,
          remainingCapacity: 5 - activeOrdersCount,
        });
      }
    }
    res.json({ success: true, transporters: availableTransporters });
  } catch (err) {
    console.error("Error fetching available transporters: ", err);
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch transporters" });
  }
};

export const assignTransporter = async (req, res) => {
  try {
    const { orderId, transporterId } = req.body;

    if (!orderId || !transporterId) {
      return res.status(400).json({ success: false });
    }
    const order = await Order.findById(orderId);

    if (!order) {
      return res.json({ success: false, message: "Order not found" });
    }

    if (order.transporterId != null) {
      return res.json({
        success: false,
        message: "Transporter already assigned",
      });
    }

    if(order.status=="Cancelled"){
      return res.json({
        success:false,
        message:"Order cancelled"
      })
    }

    order.transporterId = transporterId;
    await order.save();

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false });
  }
};
