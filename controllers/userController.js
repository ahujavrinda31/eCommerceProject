import User from "../models/User.js";
import Product from "../models/Product.js";
import Cart from "../models/Cart.js";
import Order from "../models/Order.js";
import Category from "../models/Category.js";
import mongoose from "mongoose";
export const getProfile = async (req, res) => {
  if (!req.session.isLoggedIn) return res.redirect("/");

  try {
    const user = await User.findOne(
      { email: req.session.email },
      { password: 0 },
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
      { new: true },
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

export const addToCart = async (req, res) => {
  try {
    const userId = req.session.userId;
    const productId = req.body.id;

    if (!userId) return res.status(401).json({ message: "User not logged in" });

    const product = await Product.findOne({ _id: productId });
    if (!product) return res.status(404).json({ message: "Product not found" });

    if (product.quantity <= 0) {
      return res.json({ message: "Out of stock" });
    }
    let userCart = await Cart.findOne({ userId });

    if (!userCart) {
      userCart = new Cart({ userId, items: [] });
    }

    const existingItem = userCart.items.find(
      (item) => item.productId.toString() == productId,
    );
    if (existingItem) {
      existingItem.quantity += 1;
      product.quantity -= 1;

      await userCart.save();
      await product.save();

      return res.json({
        message: "Product quantity increased in cart",
        newProductQty: product.quantity,
        cartQty: existingItem.quantity,
      });
    }

    userCart.items.push({ productId: product._id, quantity: 1 });
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
};

export const getCart = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.json({ cart: [], totalBill: 0 });
    }
    const userCart = await Cart.findOne({ userId });
    if (!userCart || userCart.items.length === 0) {
      return res.json({ cart: [], totalBill: 0 });
    }

    let fullCart = [];
    let totalBill = 0;

    for (const item of userCart.items) {
      const product = await Product.findById(item.productId).lean();
      if (!product) continue;

      const price =
        parseFloat(String(product.price).replace(/[^0-9.]/g, "")) || 0;
      fullCart.push({
        id: product._id,
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
};

export const updateCart = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { id, change } = req.body;

    if (!userId) {
      return res
        .status(401)
        .json({ success: false, message: "User not logged in" });
    }

    const userCart = await Cart.findOne({ userId });
    if (!userCart) {
      return res
        .status(404)
        .json({ success: false, message: "Cart not found" });
    }

    const cartIndex = userCart.items.findIndex(
      (item) => item.productId.toString() == id,
    );
    if (cartIndex == -1) {
      return res
        .status(404)
        .json({ success: false, message: "Item not in cart" });
    }

    const product = await Product.findById(id);
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
      const prod = await Product.findById(item.productId).lean();
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
};

export const removeFromCart = async (req, res) => {
  try {
    const userId = req.session.userId;
    const { productId } = req.body;

    if (!userId) {
      return res.status(401).json({ message: "User not logged in" });
    }

    const cart = await Cart.findOne({ userId });
    if (!cart) {
      return res.json({ success: false, message: "Cart not found" });
    }

    const itemIndex = cart.items.findIndex(
      (item) => item.productId.toString() == productId,
    );

    if (itemIndex == -1) {
      return res.json({ success: false, message: "Item not in cart" });
    }

    const item = cart.items[itemIndex];

    const product = await Product.findById(productId);
    if (product) {
      product.quantity += item.quantity;
      await product.save();
    }

    cart.items.splice(itemIndex, 1);
    await cart.save();

    let totalBill = 0;
    for (const cartItem of cart.items) {
      const prod = await Product.findById(cartItem.productId);
      if (prod) {
        totalBill += prod.price * cartItem.quantity;
      }
    }

    res.json({
      success: true,
      message: "Product removed from cart",
      restoredQty: product ? product.quantity : null,
      cartEmpty: cart.items.length === 0,
      totalBill,
    });
  } catch (err) {
    console.error("Error removing product from cart: ", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
};

export const checkout = async (req, res) => {
  const productId = req.params.id;

  if (!mongoose.Types.ObjectId.isValid(productId)) {
    return res.status(400).send("Invalid product ID");
  }

  const product = await Product.findById(productId);
  const user = await User.findById(req.session.userId);

  if (!product) {
    return res.status(404).send("Product not found");
  }

  res.render("checkout", {
    product,
    user,
  });
};

export const placeOrder = async (req, res) => {
  try {
    const { productId, qty } = req.body;
    if (!productId || !qty) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid request data" });
    }
    if (!req.session.userId) {
      return res
        .status(401)
        .json({ success: false, message: "User not logged in" });
    }
    const product = await Product.findById(productId);
    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    const user = await User.findById(req.session.userId);
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    if (product.quantity < qty) {
      return res.json({ success: false, message: "Not enough stock" });
    }
    product.quantity -= qty;
    await product.save();
    const order = new Order({
      userId: user._id,
      products: [
        {
          productId: product._id,
          name: product.name,
          qty,
          price: product.price,
          sellerId: product.sellerId,
        },
      ],
      totalBill: qty * product.price,
    });
    await order.save();
    res.json({ success: true });
  } catch (err) {
    console.error("PLACE ORDER ERROR:", err);
    res.status(500).json({ success: false, message: "Order failed" });
  }
};

export const getOrders = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.redirect("/");
    }
    const orders = await Order.find({ userId: req.session.userId }).sort({
      createdAt: -1,
    });
    res.render("viewOrders", { orders });
  } catch (err) {
    console.error("Error fetching orders: ", err);
    res.status(500).send("Failed to load orders");
  }
};

export const cancelOrder = async (req, res) => {
  try {
    if (!req.session.userId) {
      return res.status(401).json({ success: false });
    }
    const order = await Order.findById(req.params.id);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }
    if (order.userId.toString() !== req.session.userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized",
      });
    }

    if (order.status !== "Placed") {
      return res.status(400).json({
        message: "Order cannot be cancelled now",
      });
    }

    for (const item of order.products) {
      await Product.findByIdAndUpdate(item.productId, {
        $inc: { quantity: item.qty },
      });
    }
    order.status = "Cancelled";
    await order.save();
    res.json({ success: true });
  } catch (err) {
    console.error("Cancel order error: ", err);
    res.status(500).json({
      success: false,
      message: "Failed to cancel order",
    });
  }
};

export const buyNow = async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const userId = req.session.userId;

    const qty = Number(quantity);

    if (!qty || qty <= 0) {
      return res.json({ success: false, message: "Invalid quantity" });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }

    const price = Number(product.price);

    const order = new Order({
      userId: userId,
      products: [
        {
          productId: productId,
          name: product.name,
          qty: qty,
          price: product.price,
          sellerId: product.sellerId,
        },
      ],
      totalBill: price * qty,
      status: "Placed",
    });

    await order.save();

    await Cart.updateOne(
      { userId: userId },
      { $pull: { items: { productId: productId } } },
    );

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Order failed" });
  }
};

export const searchProducts = async (req, res) => {
  try {
    const query = req.query.q;

    if (!query || query.length < 3) {
      return res.json({ suggestions: [], products: [] });
    }

    const categories = await Category.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { "subcategories.name": { $regex: query, $options: "i" } },
      ],
    });

    const categoryIds = categories.map((c) => c._id);
    const products = await Product.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { subcategory: { $regex: query, $options: "i" } },
        { categoryId: { $in: categoryIds } },
      ],
    }).populate("categoryId", "name");
    const suggestions = [
      ...categories.map((c) => c.name),
      ...products.map((p) => p.name),
    ];
    res.json({ suggestions, products });
  } catch (err) {
    console.error("Suggestion error:", err);
    res.json([]);
  }
};

export const userCartPage = async (req, res) => {
  res.render("cart", { name: req.session.name });
};

export const getUserCartData = async (req, res) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return res.json({ cart: [], totalBill: 0 });
    }
    const userCart = await Cart.findOne({ userId });
    if (!userCart || userCart.items.length === 0) {
      return res.json({ cart: [], totalBill: 0 });
    }

    let fullCart = [];
    let totalBill = 0;

    for (const item of userCart.items) {
      const product = await Product.findById(item.productId).lean();
      if (!product) continue;

      const price =
        parseFloat(String(product.price).replace(/[^0-9.]/g, "")) || 0;
      fullCart.push({
        id: product._id,
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
};

export const cartPlaceOrder = async (req, res) => {
  try {
    const userId = req.session.userId;
    const cart = await Cart.findOne({ userId }).populate("items.productId");

    if (!cart || cart.items.length === 0) {
      return res.json({ success: false, message: "Cart is empty" });
    }

    const totalAmount = cart.items.reduce(
      (sum, item) => sum + item.productId.price * item.quantity,
      0,
    );

    const order = new Order({
      userId,
      products: cart.items.map((item) => ({
        productId: item.productId._id,
        name: item.productId.name,
        qty: item.quantity,
        price: item.productId.price,
        sellerId: item.productId.sellerId,
      })),
      totalBill: totalAmount,
      status: "Placed",
    });

    await order.save();

    for (const item of cart.items) {
      await Product.findByIdAndUpdate(item.productId._id, {
        $inc: { quantity: -item.quantity },
      });
    }

    await Cart.deleteOne({ userId });

    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.json({ success: false, message: "Order failed" });
  }
};

export const getProductDetails = async (req, res) => {
  const product = await Product.findById(req.params.id).populate(
    "categoryId",
    "name",
  );
  res.json(product);
};
