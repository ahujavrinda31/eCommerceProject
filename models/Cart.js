import { Schema, model } from "mongoose";

const cartItemSchema=new Schema({
    id:{type:String,required:true},
    quantity:{type:Number,default:1}
});

const cartSchema=new Schema({
    userEmail:{type:String,required:true},
    items:[cartItemSchema]
});

export default model("Cart",cartSchema);