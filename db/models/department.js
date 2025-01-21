// import { Schema, model } from 'mongoose';
import mongoose from "mongoose";

const DepartmentSchema = new mongoose.Schema({
    
    name:{
        type: String,
        required: true,
        unique: true,
        length: 255
    },
    short_name:{
        type: String,
        required: true,
        unique: true
    },
},{ timestamps: true }
);


const Department = mongoose.model('Department',DepartmentSchema);


// export default {Department}
export default Department