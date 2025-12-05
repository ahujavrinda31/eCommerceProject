import mongoose from "mongoose";
import fs from "fs/promises";
import path from "path";
import dotenv from "dotenv";

import User from "./models/User.js";
import Category from "./models/Category.js";
import Product from "./models/Product.js";
import Cart from "./models/Cart.js";

dotenv.config({ path: path.join(process.cwd(), ".env") });

mongoose
  .connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB connection error:", err));

const __dirname = path.resolve();

const usersFile = path.join(__dirname, "database/users.json");
const productsFile = path.join(__dirname, "database/products.json");
const cartFile = path.join(__dirname, "database/cart.json");

async function importData() {
  try {
    const usersRaw = await fs.readFile(usersFile, "utf-8");
    const usersData = JSON.parse(usersRaw);
    await User.insertMany(usersData);
    console.log("Users imported successfully");

    const productsRaw = await fs.readFile(productsFile, "utf-8");
    const productsData = JSON.parse(productsRaw);

    const categoryMap = {};

    for (const categoryName in productsData) {
      const subcategories = productsData[categoryName];
      const subcategoryArray = Object.keys(subcategories).map((name) => ({
        name,
      }));

      const categoryDoc = await Category.create({
        name: categoryName,
        subcategories: subcategoryArray,
      });

      categoryMap[categoryName] = {
        _id: categoryDoc._id,
        subcategories: {},
      };

      categoryDoc.subcategories.forEach((sub) => {
        categoryMap[categoryName].subcategories[sub.name] = sub._id;
      });
    }
    console.log("Categories and subcategories imported successfully");

    const productArray = [];
    for (const categoryName in productsData) {
      const subcategories = productsData[categoryName];
      for (const subcategoryName in subcategories) {
        const products = subcategories[subcategoryName];
        products.forEach((p) => {
          if (p.name && p.imagePath) {
            const cleanedPrice =
              typeof p.price === "string"
                ? Number(p.price.replace(/,/g, "").trim())
                : Number(p.price) || 0;

            productArray.push({
              id: p.id,
              name: p.name,
              price: cleanedPrice,
              quantity: p.quantity || 0,
              description: p.description || "",
              imagePath: p.imagePath,
              category: categoryMap[categoryName]._id,
              subcategory:
                categoryMap[categoryName].subcategories[subcategoryName],
            });
          } else {
            console.warn(
              ` Skipping product in ${categoryName} -> ${subcategoryName} because required fields are missing:`,
              p
            );
          }
        });
      }
    }

    await Product.insertMany(productArray);
    console.log("Products imported successfully");

    const cartRaw = await fs.readFile(cartFile, "utf-8");
    const cartData = JSON.parse(cartRaw);

    const cartsArray = [];
    for (const email in cartData) {
      const items = cartData[email].map((item) => ({
        id: item.id,  
        quantity: item.quantity || 1,
      }));
      cartsArray.push({ userEmail: email, items });
    }
    await Cart.insertMany(cartsArray);
    console.log(" Carts imported");

    console.log(" All data imported successfully!");
    process.exit();
  } catch (err) {
    console.error(" Error importing data:", err);
    process.exit(1);
  }
}

importData();
