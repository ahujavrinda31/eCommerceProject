import { Schema, model } from "mongoose";

const userSchema=new Schema({
    name:{type:String,required:true},
    email:{type:String,required:true,unique:true},
    password:{type:String,required:true},
    passwordConfirm:{type:String,required:true},
    admin: { type: String, enum: ["yes", "no"], default: "no" }
});

export default model("User",userSchema);