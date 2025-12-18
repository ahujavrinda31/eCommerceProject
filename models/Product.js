import { Schema, model, Types } from "mongoose";

const productSchema=new Schema({
    id:{type:Number,required:true,unique:true},
    name:{type:String,required:true},
    price:{type:Number,required:true},
    quantity:{type:Number,required:true},
    description:{type:String,required:true},
    imagePath:{type:String,required:true},

    category:{type:Types.ObjectId,ref:"Category",required:true,index:true},
    subcategory:{type:Types.ObjectId,ref:"Category.subcategories",required:true}    
});

export default model("Product",productSchema);