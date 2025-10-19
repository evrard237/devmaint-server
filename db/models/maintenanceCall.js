import mongoose from "mongoose";

const MaintenanceCallSchema = new mongoose.Schema({
  device: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Device",
    required: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  department: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Department",
    required: true
  },
  maintenance_type: {
    type: String,
    enum: ['preventive', 'breakdown', 'calibration'],
    default: 'breakdown',
    required: true
  },
  call_status: {
    type: String,
    enum: ['pending', 'completed'],
    default: 'pending'
  },
  nature_of_problem: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const MaintenanceCall = mongoose.model('MaintenanceCall', MaintenanceCallSchema);

export default MaintenanceCall;