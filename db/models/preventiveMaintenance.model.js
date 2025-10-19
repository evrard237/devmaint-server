import mongoose from "mongoose";

const PreventiveMaintenanceSchema = new mongoose.Schema({
  report_number: { type: String, unique: true },
  device: { type: mongoose.Schema.Types.ObjectId, ref: "Device", required: true },
  performedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  typeOfMaintenance: [{ type: String, enum: ['Lubrication', 'Cleaning', 'Part Replacement', 'Other'] }],
  observations: { type: String },
  tasksPerformed: { type: String, required: true },
  partsReplaced: [{ partName: String, partNumber: String, quantity: Number }],
  // --- ADD THIS STATUS FIELD ---
  status: { type: String, enum: ['Active', 'Entered in Error'], default: 'Active' }
}, { timestamps: true });

PreventiveMaintenanceSchema.pre('save', async function(next) {
  if (this.isNew) {
    const lastReport = await this.constructor.findOne({}, {}, { sort: { 'createdAt': -1 } });
    const lastNumber = lastReport && lastReport.report_number ? parseInt(lastReport.report_number.split('-')[1]) : 0;
    this.report_number = `PM-${String(lastNumber + 1).padStart(5, '0')}`;
  }
  next();
});

const PreventiveMaintenance = mongoose.model('PreventiveMaintenance', PreventiveMaintenanceSchema);
export default PreventiveMaintenance;