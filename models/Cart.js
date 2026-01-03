import {Schema,model,Types} from "mongoose";

const cartItemSchema=new Schema({
    productId:{type:Types.ObjectId,ref:"Product",required:true},
    quantity:{type:Number, default:1}
})

const cartSchema=new Schema({
    userId:{type:Types.ObjectId, ref:"User", required:true, unique:true},
    items:[cartItemSchema]
})

export default model("Cart",cartSchema);