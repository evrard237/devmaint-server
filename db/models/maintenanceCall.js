import mongoose from "mongoose";

const MaintenanceCallSchema = new mongoose.Schema({
    
    device_name:{
        type: String,
        required: true,
        length: 255
    },
    model:{
        type: String,
        required: true,
        length: 255
    },
    serial_number: {
        type: String,
        required: true,
       
        length: 255
    },
    department: {
        type: String,
        required: true,
        length: 255
    },
    user_id: {
        type: String,
        required: true,
        length: 255
    },
    user_designation: {
        type: String,
        required: true,
        length: 255
    },
    user_phone_number: Number,
    // type:{
    //     type: String,
    //     enum: ['preventive','breakdown'],
    //     default: 'breakdown'
    // },
    // working_status:{
    //     type: String,
    //     enum: ['working', 'Not working','pending'],
    //     default: 'working',   
    // },
    call_status: {
        type: String,
        enum: ['pending','completed'],
        default: 'pending'
    },
    nature_of_problem:{
        type: String,
        required: true
    },
    date: String,
},{ timestamps: true }
);


const MaintenanceCall = mongoose.model('MaintenanceCall',MaintenanceCallSchema);


// export default {Department}
export default MaintenanceCall