// import { Schema, model } from 'mongoose';
import mongoose from "mongoose";

const NotificationSchema = new mongoose.Schema({
    
    title:{
        type: String,
        required: true,
        length: 255
    },
    message:{
        type: String,
        required: true,
       
    },
},{ timestamps: true }
);


const Notification = mongoose.model('Notification',NotificationSchema);


// export default {Notification}
export default Notification