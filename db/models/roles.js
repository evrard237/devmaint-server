// import { Schema, model } from 'mongoose';
import mongoose from "mongoose";

const RoleSchema = new mongoose.Schema({
    
    name:{
        type: String,
        required: true,
        unique: true,
        length: 255
    }
   
},{ timestamps: true }
);


const Role = mongoose.model('Role',RoleSchema);


// export default {Department}
export default Role