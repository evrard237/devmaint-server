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
    department:{
        type: String,
        required: true
    },
    calibration_made:{
        type: String,
        required: true
    },
    calibration_result:{
        type: String,
        required: true
    },
    calibration_date:{
        type: String,
        required: true
    },
    next_calibration_date:{
        type: String,
        required: true
    },
    calibrated_by:{
        type: String,
        required: true
    },
    calibrator_phone_number:{
        type: String,
        required: true
    },
    notes:{
        type: String,
        required: true
    },

},{ timestamps: true }
);


const Calibration = mongoose.model('Calibration',CalibrationSchema);


// export default {Department}
export default Calibration