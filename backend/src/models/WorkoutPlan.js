const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: String,
  sets: Number,
  reps: String,
  restSeconds: Number,
  notes: String
}, { _id: false });

const daySchema = new mongoose.Schema({
  day: String,
  focus: String,
  exercises: [exerciseSchema]
}, { _id: false });

const workoutPlanSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  source: { type: String, enum: ['AI', 'MANUAL'], default: 'AI' },
  title: { type: String, required: true },
  goal: String,
  daysPerWeek: Number,
  days: [daySchema],
  active: { type: Boolean, default: true }
}, { timestamps: true });

module.exports = mongoose.model('WorkoutPlan', workoutPlanSchema);
