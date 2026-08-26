const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, minlength: 2, maxlength: 80 },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['USER', 'ADMIN'], default: 'USER' },
  profile: {
    age: { type: Number, min: 13, max: 100 },
    heightCm: { type: Number, min: 50, max: 250 },
    weightKg: { type: Number, min: 20, max: 300 },
    targetWeightKg: { type: Number, min: 20, max: 300 },
    fitnessGoal: { type: String, enum: ['FAT_LOSS', 'MUSCLE_GAIN', 'STRENGTH', 'GENERAL_FITNESS', 'ENDURANCE'], default: 'GENERAL_FITNESS' },
    experience: { type: String, enum: ['BEGINNER', 'INTERMEDIATE', 'ADVANCED'], default: 'BEGINNER' },
    equipment: [{ type: String, trim: true }]
  }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
