import mongoose from "mongoose";

const ScheduleSchema = new mongoose.Schema({
  date: {
    type: Date,
    required: true,
    unique: true, // Each date has only one entry
  },
  dayOfWeek: {
    type: String,
    required: true,
  },
  onDutyStaff: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User", // Reference to the User model
    required: true,
  },
}, { timestamps: true });

const Schedule = mongoose.model('Schedule', ScheduleSchema);

export default Schedule;