const mongoose = require('mongoose');

const goalSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  title: { type: String, required: true, trim: true, maxlength: 120 },
  metric: { type: String, enum: ['WEIGHT', 'WORKOUTS', 'CALORIES', 'DURATION', 'STRENGTH', 'STREAK'], required: true },
  target: { type: Number, required: true },
  current: { type: Number, default: 0 },
  deadline: { type: Date },
  status: { type: String, enum: ['ACTIVE', 'COMPLETED', 'PAUSED'], default: 'ACTIVE' }
}, { timestamps: true });

module.exports = mongoose.model('Goal', goalSchema);
