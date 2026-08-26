const User = require('../models/User');
const AIRecommendation = require('../models/AIRecommendation');
const WorkoutPlan = require('../models/WorkoutPlan');

const {
  getAnalytics,
} = require('../services/analytics.service');

const {
  coach,
  generatePlan,
  analyzeProgress,
  adaptiveRecommendation,
} = require('../services/ai.service');

async function coachChat(req, res, next) {
  try {
    const user =
      await User.findById(req.user.id)
        .select('-password')
        .lean();

    if (!user) {
      const error = new Error(
        'User not found.'
      );

      error.statusCode = 404;
      return next(error);
    }

    const metrics =
      await getAnalytics(
        req.user.id
      );

    const result = await coach({
      question: req.body.question,
      metrics,
      profile: user.profile,
    });

    await AIRecommendation.create({
      user: req.user.id,
      type: 'COACH',
      promptSummary:
        req.body.question,
      result,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function plan(req, res, next) {
  try {
    const user =
      await User.findById(req.user.id)
        .select('-password')
        .lean();

    if (!user) {
      const error = new Error(
        'User not found.'
      );

      error.statusCode = 404;
      return next(error);
    }

    const metrics =
      await getAnalytics(
        req.user.id
      );

    const profile = {
      ...user.profile,
      ...req.body,
    };

    const result =
      await generatePlan(
        profile,
        metrics
      );

    const plan =
      await WorkoutPlan.create({
        user: req.user.id,
        source: 'AI',
        ...result.plan,
      });

    await AIRecommendation.create({
      user: req.user.id,
      type: 'WORKOUT_PLAN',
      promptSummary:
        'Generate personalized workout plan',
      result: result.plan,
    });

    res.status(201).json({
      source: 'GEMINI',
      ...plan.toObject(),
    });
  } catch (err) {
    next(err);
  }
}

async function progress(req, res, next) {
  try {
    const user =
      await User.findById(req.user.id)
        .select('-password')
        .lean();

    if (!user) {
      const error = new Error(
        'User not found.'
      );

      error.statusCode = 404;
      return next(error);
    }

    const metrics =
      await getAnalytics(
        req.user.id
      );

    const result =
      await analyzeProgress(
        metrics,
        user.profile
      );

    await AIRecommendation.create({
      user: req.user.id,
      type: 'PROGRESS_ANALYSIS',
      promptSummary:
        'Progress analysis',
      result,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

async function adaptive(req, res, next) {
  try {
    const result =
      await adaptiveRecommendation(
        req.body
      );

    await AIRecommendation.create({
      user: req.user.id,
      type: 'ADAPTIVE',
      promptSummary:
        'Adaptive workout recommendation',
      result,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

module.exports = {
  coachChat,
  plan,
  progress,
  adaptive,
};