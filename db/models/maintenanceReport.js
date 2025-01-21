import mongoose from "mongoose";

const MaintenanceReportSchema = new mongoose.Schema({
    
    device_name:{
        type: String,
        required: true,
        length: 255
    },
    model:{
        type: String,
        required: true
    },
    serial_number:{
        type: String,
        required: true,
        unique: true
    },
    department: String,
    user_name: String,
    type:{
        type: String,
        enum: ['preventive','breakdown'],
        default: 'breakdown'
    },
    working_status:{
        type: String,
        // enum: ['working','Not working','pending'],
        // default: 'working',  
    },
    nature_of_problem: String,
    report: String
},{ timestamps: true }
);


const MaintenanceReport = mongoose.model('MaintenanceReport',MaintenanceReportSchema);


// export default {Department}
export default MaintenanceReport