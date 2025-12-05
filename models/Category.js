import {Schema, model} from 'mongoose';

const subcategorySchema=new Schema({
    name:{type:String,required:true}
});

const categorySchema=new Schema({
    name:{type:String,required:true,unique:true},
    subcategories:[subcategorySchema]
});

export default model("Category",categorySchema);