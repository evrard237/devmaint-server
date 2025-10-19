import mongoose from "mongoose";

const CounterSchema = new mongoose.Schema({
  _id: { type: String, required: true },
  sequence_value: { type: Number, default: 0 }
});

const Counter = mongoose.model('ReportCounter', CounterSchema);

const MaintenanceReportSchema = new mongoose.Schema({
  report_number: {
    type: Number,
    unique: true
  },
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
  // --- NEW FIELD: Link to the original call ---
  maintenanceCall: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "MaintenanceCall",
    required: true
  },
  type: {
    type: String,
    enum: ['preventive', 'breakdown', 'calibration'],
    default: 'breakdown',
    required: true
  },
  working_status: String,
  nature_of_problem: String,
  report: String,
  // --- NEW FIELD: For recommendations ---
  recommendations: {
    type: String
  }
}, { timestamps: true });

MaintenanceReportSchema.pre('save', async function(next) {
  if (this.isNew) {
    try {
      const counter = await Counter.findOneAndUpdate(
        { _id: 'maintenanceReport' },
        { $inc: { sequence_value: 1 } },
        { new: true, upsert: true }
      );
      this.report_number = counter.sequence_value;
      next();
    } catch (error) {
      next(error);
    }
  } else {
    next();
  }
});

const MaintenanceReport = mongoose.model('MaintenanceReport', MaintenanceReportSchema);

export default MaintenanceReport;