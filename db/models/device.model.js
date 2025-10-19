import mongoose from "mongoose";

const DeviceSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      length: 255,
    },
    model: {
      type: String,
      required: true,
    },
    serial_number: {
      type: String,
      required: true,
      unique: true,
    },
    brand: {
      type: String,
      required: true,
    },
    purchase_type: {
      type: String,
      required: true,
      enum: ["hospital funds", "aid", "budget direction"],
      default: "hospital funds",
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Department",
      required: true
    },
    user: {
      type: String,
    },
    service_engineer_number: {
      type: Number,
    },
    status: {
      type: String,
      enum: ["Up", "Down"],
      default: "Up",
    },
    maintenance_cycle: {
      type: String,
      enum: ["daily", "weekly", "monthly", "quarterly"],
      default: "monthly",
    },
    purchase_date: {
      type: Date,
      required: true,
    },
    warranty_due_date: { type: Date },
    installation_date: {
      type: Date,
      required: true,
    },
    notes: { type: String },
    
    // --- THIS IS THE CRITICAL FIX ---
    // The image and manual are optional, so `required` must be `false` or removed.
    device_image_url: { type: String, required: false }, // S3 file URL
    device_manual_url: { type: String, required: false }, // S3 file URL

    nextPreventiveDate: { type: Date },
    nextCalibrationDate: { type: Date }
  },
  { timestamps: true }
);

const Device = mongoose.model("Device", DeviceSchema);

export default Device;