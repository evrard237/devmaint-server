import mongoose from "mongoose";

const CalibrationSchema = new mongoose.Schema({
    
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
    diagnosis: String,
    action: String,
   
    

},{ timestamps: true }
);


const Calibration = mongoose.model('calibration',CalibrationSchema);


// export default {Department}
export default Calibration