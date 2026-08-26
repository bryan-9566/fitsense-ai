const mongoose = require('mongoose');

const aiRecommendationSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['COACH', 'WORKOUT_PLAN', 'PROGRESS_ANALYSIS', 'ADAPTIVE'], required: true },
  promptSummary: String,
  result: { type: mongoose.Schema.Types.Mixed, required: true },
  feedback: { rating: { type: Number, min: 1, max: 5 }, comment: String }
}, { timestamps: true });

module.exports = mongoose.model('AIRecommendation', aiRecommendationSchema);
