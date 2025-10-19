import mongoose from "mongoose";

const CalibrationLogSchema = new mongoose.Schema({
  device: { type: mongoose.Schema.Types.ObjectId, ref: "Device", required: true },
  calibratedBy: { type: String, required: true },
  lastCalibrated: { type: Date, required: true },
  nextCalibrationDate: { type: Date, required: true },
  status: { type: String, enum: ['Pass', 'Fail'], required: true },
  remarks: { type: String },
  calibrationType: { type: String, enum: ['Full Calibration (External)', 'Performance Verification (Internal)'], required: true },
  certificateUrl: { type: String },
  // --- ADD THIS STATUS FIELD ---
  recordStatus: { type: String, enum: ['Active', 'Entered in Error'], default: 'Active' }
}, { timestamps: true });

const CalibrationLog = mongoose.model('CalibrationLog', CalibrationLogSchema);
export default CalibrationLog;