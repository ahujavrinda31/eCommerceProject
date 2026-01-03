import User from "../models/User.js";
import Order from "../models/Order.js";

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

export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId, newStatus } = req.body;

    if (!req.session.userId) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const order = await Order.findById(orderId);
    if (order.transporterId.toString() !== req.session.userId) {
      return res.status(403).json({ message: "Not assigned transporter" });
    }

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    const validTransitions = {
      Placed: "Out for delivery",
      "Out for delivery": "Delivered",
    };

    if (validTransitions[order.status] != newStatus) {
      return res.status(400).json({ message: "Invalid status change" });
    }

    order.status = newStatus;
    if (newStatus == "Delivered") {
      order.deliveredOn = new Date();
    }
    await order.save();

    res.json({
      success: true,
      updatedStatus: order.status,
      deliveredOn: order.deliveredOn,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Failed to update status" });
  }
};
