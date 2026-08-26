const mongoose = require('mongoose');

const workoutSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  exercise: { type: String, required: true, trim: true, maxlength: 100 },
  category: { type: String, enum: ['STRENGTH', 'CARDIO', 'FLEXIBILITY', 'SPORT', 'OTHER'], default: 'STRENGTH' },
  durationMin: { type: Number, required: true, min: 1, max: 600 },
  calories: { type: Number, default: 0, min: 0 },
  sets: { type: Number, min: 0, max: 100 },
  reps: { type: Number, min: 0, max: 1000 },
  weightKg: { type: Number, min: 0, max: 1000 },
  intensity: { type: Number, min: 1, max: 10 },
  notes: { type: String, maxlength: 500 },
  date: { type: Date, default: Date.now, index: true }
}, { timestamps: true });

module.exports = mongoose.model('Workout', workoutSchema);
