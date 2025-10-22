import mongoose from "mongoose";

const CalibrationLogSchema = new mongoose.Schema({
  device: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "Device", 
    required: true 
  },
  calibratedBy: { 
    type: String, 
    required: true 
  },
  lastCalibrated: { 
    type: Date, 
    required: true 
  },
  nextCalibrationDate: { 
    type: Date, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['Pass', 'Fail'], 
    required: true 
  },
  remarks: { 
    type: String 
  },
  calibrationType: {
    type: String,
    enum: ['Full Calibration (External)', 'Performance Verification (Internal)'],
    required: true,
  },
  certificateUrl: {
    type: String,
  },
  recordStatus: { 
    type: String, 
    enum: ['Active', 'Entered in Error'], 
    default: 'Active' 
  }
}, { timestamps: true });

// --- ADD DATABASE INDEXES FOR PERFORMANCE ---
CalibrationLogSchema.index({ device: 1 }); // For fast lookups by device ID
CalibrationLogSchema.index({ lastCalibrated: -1 }); // For fast sorting by date

const CalibrationLog = mongoose.model('CalibrationLog', CalibrationLogSchema);
export default CalibrationLog;