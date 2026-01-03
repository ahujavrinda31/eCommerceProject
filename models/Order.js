import { Schema, model, Types } from "mongoose";

const orderSchema = new Schema({
  userId: { type: Types.ObjectId, ref: "User", required: true },

  products: [
    {
      productId: { type: Types.ObjectId, ref: "Product", required: true },
      name: { type: String, required: true },
      qty: { type: Number, required: true },
      price: { type: Number, required: true },
      sellerId: { type: Types.ObjectId, required: true, ref: "User" },
    },
  ],

  totalBill: { type: Number, required: true },
  orderedOn: { type: Date, default: Date.now },
  deliveredOn: { type: Date, default: null },
  transporterId: {
    type: Types.ObjectId,
    ref: "User",
    default: null,
  },
  status: {
    type: String,
    enum: ["Placed", "Out for delivery", "Delivered", "Cancelled"],
    default:"Placed"
  },
}, { timestamps: true });

export default model("Order", orderSchema);
