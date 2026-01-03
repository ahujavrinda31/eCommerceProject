import {Schema, model} from 'mongoose';

const categorySchema=new Schema({
    name:{type:String,required:true,unique:true,lowercase:true},
    subcategories:[
        {name:{type:String,required:true,lowercase:true,trim:true}}
    ]
})

export default model("Category",categorySchema);