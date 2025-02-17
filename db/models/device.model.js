
import mongoose from 'mongoose';

const DeviceSchema = new mongoose.Schema({
    
    name:{
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
    brand: {
        type: String,
        required: true
    },
    purchase_type:{
        type: String,
        required: true,
        enum: ['hospital funds','aid','budget direction'],
        default: 'hospital funds'
    },
    department:{
        type: String,
        required: true
    },
    user:{
        type: String
    },
    service_engineer_number:{
        type: Number
    },
   
    status:{
        type: String,
        enum: ['Up','Down'],
        default: 'Up'
    },
    maintenance_cycle:{
        type: String,
        enum: ['daily','weekly','monthly','trimestrial'],
        default: 'weekly'
    },
    purchase_date:{
        type: Date,
        required: true
    },
    installation_date:{
        type: Date,
        required: true
    },
    preventive_date: Date,
    warranty_due_date:{
        type: Date
    }
    
},{ timestamps: true }
);

// {
//     type: String,
//     enum: ['daily','weekly','monthly','trimestrial'],
//     default: ''
// }
const Device = mongoose.model('Device',DeviceSchema);


export default Device;