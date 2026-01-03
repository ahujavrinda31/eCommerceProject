import { Schema, model, Types } from "mongoose";

const productSchema = new Schema({  
  name: { type: String, required: true },
  price: { type: Number, required: true },
  quantity: { type: Number, required: true },
  description: { type: String, required: true },
  imagePath: { type: String, required: true },

  sellerId: { type: Types.ObjectId, ref: "User", required: true },

  categoryId: { type: Types.ObjectId,ref:"Category", required: true },
  subcategory: { type: String, required: true },
});

export default model("Product", productSchema);