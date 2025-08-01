require("dotenv").config({ path: __dirname + "/.env" });
const express = require("express");
const session = require("express-session");
const fs = require("fs");
const path = require("path");
const nodemailer = require("nodemailer");
const multer = require("multer");
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

const PRODUCTS_FILE = path.join(__dirname, "database/products.json");
const CART_FILE = path.join(__dirname, "database/cart.json");
const USERS_FILE = path.join(__dirname, "database/users.json");
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

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

app.get("/admin", (req, res) => {
  if (!req.session.isLoggedIn || req.session.admin === false)
    return res.redirect("/login");

  const email = req.session.email;

  fs.readFile(USERS_FILE, "utf-8", (err, userData) => {
    if (err) return res.send("Error reading users");

    let users = JSON.parse(userData || "[]");
    const exists = users.find((u) => u.email === email);
    if (!exists) return res.send("User not found");

    fs.readFile(PRODUCTS_FILE, "utf-8", (err, productData) => {
      if (err) return res.send("Error reading products");

      const products = JSON.parse(productData || "[]");
      res.render("admin", { user: "Admin", name: req.session.name, products });
    });
  });
});

app.post("/send-otp", (req, res) => {
  const { email } = req.body;
  fs.readFile(USERS_FILE, "utf-8", (err, data) => {
    if (err) {
      console.error("Error reading users.json:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }

    const users = JSON.parse(data || "[]");

    const existingUser = users.find((user) => user.email === email);

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
      subject: "Your OTP for signup",
      text: `Your OTP is: ${otp}`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err)
        return res.json({ success: false, message: "Failed to send otp" });
      res.json({ success: true });
    });
  });
});

app.post("/verify-otp", (req, res) => {
  const { name, email, password, passwordConfirm, admin, otp } = req.body;
  const record = otpStore[email];

  if (!record || Date.now() > record.expiresAt) {
    return res.json({ success: false, message: "OTP expired or invalid" });
  }
  if (record.otp != otp) {
    return res.json({ success: false, message: "Incorrect OTP" });
  }

  fs.readFile(USERS_FILE, "utf-8", (err, data) => {
    let users = [];
    if (!err) {
      try {
        users = JSON.parse(data);
      } catch {}
    }

    const newUser = {
      name,
      email,
      password,
      passwordConfirm,
      admin,
    };

    users.push(newUser);
    fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf-8", (err) => {
      if (err)
        return res.json({ success: false, message: "Could not save user" });

      if (admin === "no") {
        fs.readFile(CART_FILE, "utf-8", (err, data) => {
          let cart = {};
          if (!err) {
            try {
              cart = JSON.parse(data);
            } catch {
              cart = {};
            }
          }
          cart[email] = [];
          fs.writeFile(
            CART_FILE,
            JSON.stringify(cart, null, 2),
            "utf-8",
            () => {
              delete otpStore[email];
              return res.json({
                success: true,
                message: "Signup successful. Redirecting to login...",
              });
            }
          );
        });
      } else {
        delete otpStore[email];
        return res.json({
          success: true,
          message: "Signup successful. Redirecting to login...",
        });
      }
    });
  });
});

app.post("/forgot-password/send-otp", (req, res) => {
  const { email } = req.body;

  fs.readFile(USERS_FILE, "utf-8", (err, data) => {
    if (err)
      return res.status(500).json({ success: false, message: "Server error" });

    const users = JSON.parse(data || "[]");
    const user = users.find((u) => u.email === email);
    if (!user) return res.json({ success: false, message: "User not found" });

    const otp = generateOTP();
    otpStore[email] = { otp, expiresAt: Date.now() + 5 * 60 * 1000 };

    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: email,
      subject: "Password Reset OTP",
      text: `Your OTP to reset password is: ${otp}`,
    };

    transporter.sendMail(mailOptions, (err, info) => {
      if (err) {
        console.error("OTP email error:", err);
        return res.json({ success: false, message: "Failed to send OTP" });
      }
      return res.json({ success: true });
    });
  });
});

app.post("/forgot-password/verify", (req, res) => {
  const { email, otp, newPassword } = req.body;
  const record = otpStore[email];

  if (!record || Date.now() > record.expiresAt) {
    return res.json({ success: false, message: "OTP expired or invalid" });
  }
  if (record.otp != otp) {
    return res.json({ success: false, message: "Incorrect OTP" });
  }

  fs.readFile(USERS_FILE, "utf-8", (err, data) => {
    if (err) return res.json({ success: false, message: "Server error" });

    let users = JSON.parse(data || "[]");
    const index = users.findIndex((u) => u.email === email);
    if (index === -1)
      return res.json({ success: false, message: "User not found" });

    users[index].password = newPassword;
    users[index].passwordConfirm = newPassword;

    fs.writeFile(USERS_FILE, JSON.stringify(users, null, 2), "utf-8", (err) => {
      if (err)
        return res.json({
          success: false,
          message: "Failed to update password",
        });

      delete otpStore[email];
      return res.json({
        success: true,
        message: "Password updated. Please login.",
      });
    });
  });
});

app.post("/loginScript", (req, res) => {
  const { emailLogin, passwordLogin } = req.body;
  fs.readFile(USERS_FILE, "utf-8", (err, data) => {
    if (err) {
      return res.status(500).send("Internal server error");
    }
    let users = [];
    try {
      users = JSON.parse(data);
    } catch {
      users = [];
    }
    const user = users.find(
      (u) => u.email === emailLogin && u.password === passwordLogin
    );
    if (!user) return res.status(400).send("Invalid credentials");

    req.session.email = user.email;
    req.session.name = user.name;
    req.session.admin = user.admin === "yes";
    req.session.isLoggedIn = true;

    if (req.session.admin) {
      return res.send("yes");
    } else {
      return res.send("no");
    }
  });
});

app.post("/addProduct", upload.single("image"), function (req, res) {
  const { name, price, quantity, description, category, subcategory } =
    req.body;
  const imagePath = req.file.filename;

  fs.readFile(PRODUCTS_FILE, "utf8", function (err, data) {
    let products = {};
    if (!err && data) {
      try {
        products = JSON.parse(data);
      } catch {}
    }

    if (!products[category]) products[category] = {};
    if (!products[category][subcategory]) products[category][subcategory] = [];

    products[category][subcategory].push({
      id: Date.now(),
      name,
      price,
      quantity,
      description,
      imagePath,
    });

    fs.writeFile(
      PRODUCTS_FILE,
      JSON.stringify(products, null, 2),
      function (err) {
        if (err) return res.status(500).send("Error saving product");
        res.redirect("/admin");
      }
    );
  });
});

app.post("/updateProduct", upload.single("image"), function (req, res) {
  const { name, price, quantity, description, category, subcategory, index } =
    req.body;
  const newImage = req.file;

  fs.readFile(PRODUCTS_FILE, "utf8", function (err, data) {
    if (err) return res.json({ success: false });

    let products = JSON.parse(data);
    let product = products[category][subcategory][index];

    let newImagePath = null;

    if (newImage) {
      fs.unlink("uploads/" + product.imagePath, () => {});
      product.imagePath = newImage.filename;
      newImagePath = newImage.filename;
    }

    product.name = name;
    product.price = price;
    product.quantity = quantity;
    product.description = description;

    fs.writeFile(
      PRODUCTS_FILE,
      JSON.stringify(products, null, 2),
      function (err) {
        if (err) return res.json({ success: false });
        res.json({ success: true, newImagePath });
      }
    );
  });
});

app.delete("/deleteProduct", (req, res) => {
  const { category, subcategory, index } = req.body;

  fs.readFile(PRODUCTS_FILE, "utf-8", (err, data) => {
    if (err) return res.json({ success: false });

    let products = JSON.parse(data);
    const prod = products[category][subcategory][index];

    fs.unlink("uploads/" + prod.imagePath, () => {});

    products[category][subcategory].splice(index, 1);

    fs.writeFile(PRODUCTS_FILE, JSON.stringify(products, null, 2), (err) => {
      if (err) return res.json({ success: false });
      res.json({ success: true });
    });
  });
});

app.get("/home", (req, res) => {
  if (req.session.isLoggedIn && req.session.admin === false) {
    fs.readFile(PRODUCTS_FILE, "utf-8", (err, data) => {
      if (err) return res.status(500).send("Could not read products");

      const products = JSON.parse(data);

      res.render("home", {
        email: req.session.email,
        name: req.session.name,
        products,

      });
    });
  } else {
    res.redirect("/login");
  }
});

app.post("/add-to-cart", (req, res) => {
  const email = req.session.email;
  const productId = req.body.id;

  fs.readFile(CART_FILE, "utf-8", (err, cartData) => {
    if (err) return res.status(500).json({ message: "Server error" });

    let cart = {};
    if (cartData) cart = JSON.parse(cartData);

    if (!cart[email]) {
      cart[email] = [];
    }

    const userCart = cart[email];

    const alreadyInCart = userCart.find((item) => item.id == productId);
    if (alreadyInCart) {
      return res.json({ message: "Product already in cart" });
    }

    fs.readFile(PRODUCTS_FILE, "utf-8", (err, productsData) => {
      if (err) return res.status(500).json({ message: "Server error" });

      const products = JSON.parse(productsData);
      let productToAdd = null;

      for (const category in products) {
        for (const subcategory in products[category]) {
          const found = products[category][subcategory].find(
            (p) => p.id == productId
          );
          if (found) {
            productToAdd = found;
            break;
          }
        }
        if (productToAdd) break;
      }

      const cartItem = {
        id: productToAdd.id,
        quantity: 1,
      };

      userCart.push(cartItem);
      cart[email] = userCart;

      fs.writeFile(CART_FILE, JSON.stringify(cart, null, 2), (err) => {
        if (err)
          return res.status(500).json({ message: "Failed to save cart" });

        res.json({ message: "Product added to cart" });
      });
    });
  });
});

app.get("/cart", (req, res) => {
  fs.readFile(CART_FILE, "utf8", (err, cartData) => {
    if (err) return res.json({ cart: [] });

    const cart = JSON.parse(cartData);
    const userCart = cart[req.session.email] || [];
    fs.readFile(PRODUCTS_FILE, "utf-8", (err, productData) => {
      if (err) return res.json({ cart: [] });

      const products = JSON.parse(productData);
      let fullCart = [];

      userCart.forEach((cartItem) => {
        let foundProduct = null;

        for (const category in products) {
          for (const subcategory in products[category]) {
            const match = products[category][subcategory].find(
              (p) => p.id == cartItem.id
            );
            if (match) {
              foundProduct = match;
              break;
            }
          }
          if (foundProduct) break;
        }
        if (foundProduct) {
          fullCart.push({
            id: foundProduct.id,
            name: foundProduct.name,
            price: foundProduct.price,
            description: foundProduct.description,
            image: foundProduct.imagePath,
            quantity: cartItem.quantity,
          });
        }
      });
      return res.json({ cart: fullCart });
    });
  });
});

app.post("/update-cart", (req, res) => {
  const { id, change } = req.body;
  const email = req.session.email;

  fs.readFile(CART_FILE, "utf8", (err, data) => {
    if (err) return res.json({ success: false });

    const cart = JSON.parse(data);
    const userCart = cart[email] || [];
    const itemIndex = userCart.findIndex((i) => i.id == id);

    if (itemIndex === -1) return res.json({ success: false });

    userCart[itemIndex].quantity += change;

    let removed = false;
    if (userCart[itemIndex].quantity <= 0) {
      userCart.splice(itemIndex, 1);
      removed = true;
    }

    cart[email] = userCart;

    fs.writeFile(CART_FILE, JSON.stringify(cart, null, 2), (err) => {
      if (err) return res.json({ success: false });

      res.json({
        success: true,
        removed,
        newQty: removed ? 0 : userCart[itemIndex].quantity,
      });
    });
  });
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
