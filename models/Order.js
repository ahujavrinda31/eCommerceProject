import { Schema, model, Types } from "mongoose";

const orderSchema = new Schema({
    userId: { type: Types.ObjectId, ref: "User", required: true },
    userName: { type: String, required: true },
    userEmail: { type: String, required: true },

    products: [
        {
            productId: { type: Types.ObjectId, ref: "Product", required: true },
            name: { type: String, required: true },
            qty: { type: Number, required: true },
            price: { type: Number, required: true },
        }
    ],

    totalBill: { type: Number, required: true },
    placedAt: { type: Date, default: Date.now }
});

export default model("Order", orderSchema);
