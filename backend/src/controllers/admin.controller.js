const User = require('../models/User');
const Workout = require('../models/Workout');
const AIRecommendation = require('../models/AIRecommendation');

async function stats(req, res, next) {
  try {
    const [users, workouts, aiAnalyses] = await Promise.all([
      User.countDocuments(),
      Workout.countDocuments(),
      AIRecommendation.countDocuments()
    ]);
    res.json({ users, workouts, aiAnalyses });
  } catch (err) { next(err); }
}

async function users(req, res, next) {
  try { res.json(await User.find().select('-password').sort({ createdAt: -1 }).limit(100).lean()); } catch (err) { next(err); }
}

module.exports = { stats, users };
