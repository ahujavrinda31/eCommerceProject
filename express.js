import dotenv from "dotenv";
import express from "express";
import session from "express-session";
import fs from "fs";
import path from "path";
import nodemailer from "nodemailer";
import multer from "multer";
import User from "./models/User.js";
import Product from "./models/Product.js";
import Cart from "./models/Cart.js";
import Category from "./models/Category.js";
import mongoose from "mongoose";
dotenv.config();
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});
mongoose.connection.on("connected", () => {
  console.log(" Connected to MongoDB");
});

mongoose.connection.on("error", (err) => {
  console.error(" MongoDB connection error:", err);
});

const app = express();
const PORT = 4000;

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/");
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname);
  },
});

const upload = multer({ storage: storage });

app.set("view engine", "ejs");

app.use(express.json());

app.use(
  session({
    secret: "keyboard-cat",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 1000 * 60 * 60,
    },
  })
);

app.use(express.static("public"));

app.use("/uploads", express.static(path.join("uploads")));

const otpStore = {};
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

app.get("/", (req, res) => {
  res.render("page");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/signup", (req, res) => {
  res.render("signup");
});

app.post("/send-otp", async (req, res) => {
  const { email } = req.body;
  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });
    }
    const otp = generateOTP();
    otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Your otp for signup",
      text: `Your otp is; ${otp}`,
    };
    await transporter.sendMail(mailOptions);
    res.json({ success: true });
  } catch (err) {
    console.error("Otp email error:", err);
    return res.json({ success: false, message: "Failed to send otp" });
  }
});

app.post("/verify-otp", async (req, res) => {
  const { name, email, password, passwordConfirm, admin, otp } = req.body;
  const record = otpStore[email];

  if (!record || Date.now() > record.expiresAt) {
    return res.json({ success: false, message: "OTP expired or invalid" });
  }
  if (record.otp != otp) {
    return res.json({ success: false, message: "Incorrect OTP" });
  }
  try {
    const newUser = new User({ name, email, password, passwordConfirm, admin });
    await newUser.save();

    if (admin === "no") {
      await Cart.create({ userEmail:email, items: [] });
    }

    delete otpStore[email];
    return res.json({
      success: true,
      message: "Signup successful. Redirecting to login...",
    });
  } catch (err) {
    console.error("Error saving user:", err);
    return res.json({ success: false, message: "Could not save user" });
  }
});

app.post("/forgot-password/send-otp", async (req, res) => {
  const { email } = req.body;
  try {
    const user = await User.findOne({ email });
    if (!user) return res.json({ success: false, message: "User not found" });

    const otp = generateOTP();
    otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

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
});

app.post("/forgot-password/verify", async (req, res) => {
  const { email, otp, newPassword } = req.body;
  const record = otpStore[email];

  if (!record || Date.now() > record.expiresAt)
    return res.json({ success: false, message: "OTP expired or invalid" });
  if (record.otp != otp)
    return res.json({ success: false, message: "Incorrect OTP" });

  try {
    const user = await User.findOneAndUpdate(
      { email },
      { password: newPassword, passwordConfirm: newPassword }
    );
    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }
    delete otpStore[email];
    return res.json({
      success: true,
      message: "Password updated. Please login.",
    });
  } catch (err) {
    console.error("Error updating password:", err);
    return res.json({ success: false, message: "Failed to update password" });
  }
});

app.post("/loginScript", async (req, res) => {
  const { emailLogin, passwordLogin } = req.body;
  try {
    const user = await User.findOne({
      email: emailLogin,
      password: passwordLogin,
    });
    if (!user) {
      return res.status(400).send("Invalid credentials");
    }
    req.session.email = user.email;
    req.session.name = user.name;
    req.session.admin = user.admin === "yes";
    req.session.isLoggedIn = true;

    res.send(req.session.admin ? "yes" : "no");
  } catch (err) {
    console.error("Login error:", err);
    return res.status(500).send("Internal server error");
  }
});

app.get("/session-status", (req, res) => {
  res.json({
    email: req.session.email || null,
  });
});

app.get("/admin", async (req, res) => {
  if (!req.session.isLoggedIn || req.session.admin === false) {
    return res.redirect("/login");
  }

  try {
    const email = req.session.email;
    const user = await User.findOne({ email });
    if (!user) return res.send("User not found");

    const categories = await Category.find().lean();

    const products = await Product.find()
      .populate("category", "name subcategories")
      .lean();

    const grouped = {};
    for (const prod of products) {
      const catName = prod.category?.name ?? String(prod.category);

      let subName = String(prod.subcategory || "");
      if (prod.category?.subcategories) {
        const sub = prod.category.subcategories.find(
          (s) => String(s._id) === String(prod.subcategory)
        );
        if (sub?.name) subName = sub.name;
      }

      if (!grouped[catName]) grouped[catName] = {};
      if (!grouped[catName][subName]) grouped[catName][subName] = [];
      grouped[catName][subName].push(prod);
    }

    return res.render("admin", {
      name: req.session.name,
      email: req.session.email,
      products: grouped,
      categories,
    });
  } catch (err) {
    console.error("Error fetching admin data:", err);
    return res.send("Error reading products");
  }
});

app.post("/addProduct", upload.single("image"), async (req, res) => {
  try {
    const {
      name,
      price,
      quantity,
      description,
      categoryId,
      category,
      subcategoryId,
      subcategory,
    } = req.body;

    const imagePath = req.file ? req.file.filename : null;

    const finalCategoryId = categoryId || category;
    const finalSubcategoryId = subcategoryId || subcategory;

    if (!finalCategoryId) {
      return res.status(400).json({ success: false, message: "Category missing" });
    }
    if (!finalSubcategoryId) {
      return res.status(400).json({ success: false, message: "Subcategory missing" });
    }

    const categoryDoc = await Category.findById(finalCategoryId);
    if (!categoryDoc) {
      return res.status(400).json({ success: false, message: "Category not found" });
    }

    const subDoc = categoryDoc.subcategories.id(finalSubcategoryId);
    if (!subDoc) {
      return res.status(400).json({ success: false, message: "Subcategory not found" });
    }

    const newProduct = new Product({
      id: Date.now(),
      name,
      price,
      quantity,
      description,
      imagePath,
      category: categoryDoc._id,
      subcategory: subDoc._id,
    });

    await newProduct.save();

    return res.json({ success: true, message: "Product added" });
  } catch (err) {
    console.error("Error adding product:", err);
    return res.status(500).json({ success: false, message: "Server error" });
  }
});


app.post("/updateProduct", upload.single("image"), async (req, res) => {
  try {
    const { id, name, price, quantity, description } = req.body;
    const newImage = req.file ? req.file.filename : null;

    const product = await Product.findById(id);
    if (!product)
      return res.json({ success: false, message: "Product not found" });

    if (newImage) {
      fs.unlink(`uploads/${product.imagePath}`, () => {});
      product.imagePath = newImage;
    }

    product.name = name;
    product.price = price;
    product.quantity = quantity;
    product.description = description;

    await product.save();
    res.json({ success: true, newImagePath: newImage });
  } catch (err) {
    console.error("Error updating product:", err);
    return res.json({ success: false, message: "Error updating product" });
  }
});

app.delete("/deleteProduct", async (req, res) => {
  try {
    const { id } = req.body;

    const product = await Product.findById(id);
    if (!product)
      return res.json({ success: false, message: "Product not found" });

    fs.unlink(`uploads/${product.imagePath}`, () => {});

    await Product.findByIdAndDelete(id);

    res.json({ success: true });
  } catch (err) {
    console.error("Error deleting product:", err);
    return res.json({ success: false, message: "Error deleting product" });
  }
});

app.get("/get-subcategories/:id", async (req, res) => {
  try {
    const id = req.params.id;
    let category = null;
    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      category = await Category.findById(id);
    }

    if (!category) {
      category = await Category.findOne({ name: id });
    }

    if (!category) {
      return res.json({
        success: false,
        message: "Category not found",
      });
    }

    return res.json({
      success: true,
      subcategories: category.subcategories || [],
    });
  } catch (err) {
    console.error("Subcategory fetch error:", err);
    res.json({ success: false, message: "Server Error" });
  }
});


app.post("/add-category", async (req, res) => {
  try {
    const { category } = req.body;
    const existing = await Category.findOne({ name: category });
    if (existing)
      return res.json({ success: false, message: "Category already exists" });

    const newCategory = new Category({ name: category, subcategories: [] });
    await newCategory.save();
    return res.json({ success: true, message: "Category added successfully" });
  } catch (err) {
    console.error("Error adding category:", err);
    return res.json({ success: false, message: "Failed to add category" });
  }
});

app.post("/add-subcategory", async (req, res) => {
  try {
    const { category, subcategory } = req.body;
    const categoryDoc = await Category.findOne({ name: category });
    if (!categoryDoc)
      return res.json({ success: false, message: "Category not found" });

    const exists = categoryDoc.subcategories.find(
      (sub) => sub.name === subcategory
    );
    if (exists)
      return res.json({
        success: false,
        message: "Subcategory already exists",
      });

    categoryDoc.subcategories.push({ name: subcategory });
    await categoryDoc.save();

    return res.json({
      success: true,
      message: "Subcategory added successfully",
    });
  } catch (err) {
    console.error("Add subcategory error:", err);
    return res.json({ success: false, message: "Error adding subcategory" });
  }
});

// app.get("/get-users", async (req, res) => {
//   try {
//     if (!req.session.isLoggedIn || req.session.admin === false) {
//       return res.redirect("/login");
//     }
//     const normalUsers = await User.find({ admin: "no" });

//     return res.json({ user: normalUsers });
//   } catch (err) {
//     console.error("Error fetching users from MongoDB:", err);
//     return res.status(500).json({ message: "Server error" });
//   }
// });

app.get("/home", async (req, res) => {
  if (req.session.isLoggedIn && req.session.admin === false) {
    try {
      const products = await Product.find()
        .populate("category", "name subcategories")
        .lean();
      const grouped = {};
      for (const prod of products) {
        const catName =
          prod.category && prod.category.name
            ? prod.category.name
            : String(prod.category);
        let subName = String(prod.subcategory || "");
        if (prod.category && Array.isArray(prod.category.subcategories)) {
          const sub = prod.category.subcategories.find(
            (s) => String(s._id) === String(prod.subcategory)
          );
          if (sub && sub.name) subName = sub.name;
        }

        if (!grouped[catName]) grouped[catName] = {};
        if (!grouped[catName][subName]) grouped[catName][subName] = [];
        grouped[catName][subName].push(prod);
      }
      res.render("home", {
        name: req.session.name,
        email: req.session.email,
        products: grouped,
      });
    } catch (err) {
      res.status(500).send("Could not read products");
    }
  } else {
    res.redirect("/login");
  }
});

app.post("/add-to-cart", async (req, res) => {
  try {
    const userEmail = req.session.email;
    const productId = req.body.id;

    if (!userEmail)
      return res.status(401).json({ message: "User not logged in" });

    const product = await Product.findOne({ id: productId });
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (product.quantity <= 0) {
      return res.json({ message: "Out of stock" });
    }
    let userCart = await Cart.findOne({ userEmail });

    if (!userCart) {
      userCart = new Cart({ userEmail, items: [] });
    }

    const existingItem = userCart.items.find((item) => item.id == productId);
    if (existingItem) {
      return res.json({ message: "Product already in cart" });
    }

    userCart.items.push({ id: productId, quantity: 1 });
    product.quantity -= 1;

    await userCart.save();
    await product.save();

    res.json({
      message: "Product added to cart",
      newProductQty: product.quantity,
    });
  } catch (err) {
    console.error("Error adding to cart:", err);
    return res.status(500).json({ message: "Server error" });
  }
});

app.get("/cart", async (req, res) => {
  try {
    const userEmail = req.session.email;
    if (!userEmail) {
      return res.json({ cart: [], totalBill: 0 });
    }
    const userCart = await Cart.findOne({ userEmail });
    if (!userCart || userCart.items.length === 0) {
      return res.json({ cart: [], totalBill: 0 });
    }

    let fullCart = [];
    let totalBill = 0;

    for (const item of userCart.items) {
      const product = await Product.findOne({ id: item.id }).lean();
      if (!product) continue;

      const price =
        parseFloat(String(product.price).replace(/[^0-9.]/g, "")) || 0;
      fullCart.push({
        id: product.id,
        name: product.name,
        price: price,
        description: product.description,
        image: product.imagePath,
        quantity: item.quantity,
      });
      totalBill += price * item.quantity;
    }
    return res.json({ cart: fullCart, totalBill: totalBill || 0 });
  } catch (err) {
    console.error("Error fetching cart:", err);
    return res.json({ cart: [], totalBill: 0 });
  }
});

app.post("/update-cart", async (req, res) => {
  try {
    const userEmail = req.session.email;
    const { id, change } = req.body;

    if (!userEmail) {
      return res
        .status(401)
        .json({ success: false, message: "User not logged in" });
    }

    const userCart = await Cart.findOne({ userEmail });
    if (!userCart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    const cartIndex = userCart.items.findIndex((item) => item.id == id);
    if (cartIndex == -1) {
      return res
        .status(404)
        .json({ success: false, message: "Item not in cart" });
    }

    const product = await Product.findOne({ id });
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    if (change === 1) {
      if (product.quantity > 0) {
        userCart.items[cartIndex].quantity += 1;
        product.quantity -= 1;
      } else {
        return res
          .status(400)
          .json({ success: false, message: "Product out of stock" });
      }
    } else if (change === -1) {
      userCart.items[cartIndex].quantity -= 1;
      product.quantity += 1;
      if (userCart.items[cartIndex].quantity === 0) {
        userCart.items.splice(cartIndex, 1);
      }
    } else {
      return res
        .status(400)
        .json({ success: false, message: "Invalid operation" });
    }
    await userCart.save();
    await product.save();

    let totalBill = 0;
    for (const item of userCart.items) {
      const prod = await Product.findOne({ id: item.id }).lean();
      if (!prod) continue;
      const price = parseFloat(String(prod.price).replace(/[^0-9.]/g, "")) || 0;
      totalBill += price * item.quantity;
    }
    res.json({
      success: true,
      message: "Cart updated successfully",
      newQty:
        userCart.items[cartIndex] && userCart.items[cartIndex].quantity
          ? userCart.items[cartIndex].quantity
          : 0,
      newProductQty: product.quantity,
      totalBill: totalBill || 0,
      cartEmpty: userCart.items.length === 0,
    });
  } catch (err) {
    console.error("Error updating cart:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

app.post("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) return res.status(500).json({ success: false });
    res.json({ success: true });
  });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
