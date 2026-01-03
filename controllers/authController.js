import User from "../models/User.js";
import OTP from "../models/OTP.js";
import Product from "../models/Product.js";
import Category from "../models/Category.js";
import Order from "../models/Order.js";
import mongoose from "mongoose";
import nodemailer from "nodemailer";
import dotenv from "dotenv";
dotenv.config();

function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export const sendOTP = async (req, res) => {
  const { email } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });
    }
    const otp = generateOTP();
    await OTP.create({ email, otp, expiresAt: Date.now() + 300000 });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your otp for signup",
      text: `Your otp is: ${otp}`,
    };
    await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (err) {
    console.error("Otp email error:", err);
    return res.json({ success: false, message: "Failed to send otp" });
  }
};

export const verifyOTP = async (req, res) => {
  const { name, email, password, phone, role, address, gstNo, vehicleNo, otp } =
    req.body;

  try {
    const record = await OTP.findOne({ email });

    if (!record) {
      return res.json({ success: false, message: "OTP expired or invalid" });
    }

    if (Date.now() > record.expiresAt) {
      await OTP.deleteOne({ email });
      return res.json({ success: false, message: "OTP expired" });
    }

    if (record.otp !== otp) {
      return res.json({ success: false, message: "Incorrect OTP" });
    }

    const status =
      role == "seller" || role == "transporter" ? "pending" : "approved";

    const newUser = new User({
      name,
      email,
      password,
      phone,
      role,
      address,
      gstNo,
      vehicleNo,
      status,
    });

    await newUser.save();
    await OTP.deleteOne({ email });

    return res.json({
      success: true,
      message: "Signup successful",
    });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
};

export const forgotPasswordSentOtp = async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.json({ success: false, message: "User not found" });

    const otp = generateOTP();
    await OTP.create({ email, otp, expiresAt: Date.now() + 300000 });

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP to reset password is: ${otp}`,
    };

    await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Failed to send OTP" });
  }
};

export const forgotPasswordVerifyOtp = async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const record = await OTP.findOne({ email });

    if (!record) {
      return res.json({ success: false, message: "OTP expired or invalid" });
    }

    if (Date.now() > record.expiresAt) {
      await OTP.deleteOne({ email });
      return res.json({ success: false, message: "OTP expired" });
    }

    if (record.otp !== otp) {
      return res.json({ success: false, message: "Incorrect OTP" });
    }

  try {
    const user = await User.findOneAndUpdate(
      { email },
      { password: newPassword }
    );
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    await OTP.deleteOne({email});
    return res.json({
      success: true,
      message: "Password updated. Please login.",
    });
  } catch (err) {
    console.error("Error updating password:", err);
    return res.json({ success: false, message: "Failed to update password" });
  }
};

export const loginScript = async (req, res) => {
  const { emailLogin, passwordLogin } = req.body;

  try {
    const user = await User.findOne({ email: emailLogin });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "User not found",
      });
    }

    if (user.status == "pending") {
      return res
        .status(403)
        .json({ success: false, message: "Admin approval pending" });
    }

    if (user.password !== passwordLogin) {
      return res.status(400).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    req.session.userId = user._id;
    req.session.email = user.email;
    req.session.name = user.name;
    req.session.role = user.role;
    req.session.isLoggedIn = true;

    return res.json({
      success: true,
      role: user.role,
    });
  } catch (err) {
    console.error("Login error:", err);
    return res
      .status(500)
      .json({ success: false, message: "Internal server error" });
  }
};

export const logout = async (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ success: false });
    }

    res.clearCookie("connect.sid");
    return res.json({ success: true });
  });
};

export const admin = async (req, res) => {
  try {
    const users = await User.find({
      role: { $in: ["seller", "transporter"] },
      status: "pending",
    });
    res.render("admin", {
      name: req.session.name,
      users,
    });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

export const user = async (req, res) => {
  try {
    const searchCategory = req.query.category?.trim().toLowerCase();
    let products;
    let message="";
    if (searchCategory) {
      const category = await Category.findOne({ name: searchCategory });
      if (!category) {
        products=[];
        message = "No products for this category";   
      } else {
        products = await Product.find({ categoryId: category._id });
        if (products.length === 0) {
          message = "No products for this category";
        }
      }
    } else {
      products = await Product.find();
    }

    const groupedProducts = {};
    for (let product of products) {
      const category = await Category.findById(product.categoryId);
      if (!groupedProducts[category.name]) {
        groupedProducts[category.name] = [];
      }
      groupedProducts[category.name].push(product);
    }

    res.render("user", {
      name: req.session.name,
      products: groupedProducts,
      searchCategory: searchCategory || "",
      message
    });
  } catch (err) {
    console.error(err);
    res.status(500).json("Server error");
  }
};

export const seller = async (req, res) => {
  try {
    const products = await Product.find({ sellerId: req.session.userId });
    res.render("seller", { name: req.session.name, products });
  } catch (err) {
    console.error(err);
    res.status(500).send("Server error");
  }
};

export const transporterRole = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect("/");
    }

    const transporterId = new mongoose.Types.ObjectId(
      String(req.session.userId)
    );

    const orders = await Order.find({
      transporterId: transporterId,
    }).sort({ createdAt: -1 });

    res.render("transporter", {
      name: req.session.name,
      orders,
    });
  } catch (err) {
    console.error("Error fetching transporter orders:", err);
    res.status(500).send("Failed to load orders");
  }
};
