const router = require('express').Router();

const auth = require('../middleware/auth');
const WorkoutPlan = require('../models/WorkoutPlan');

router.use(auth);

router.get('/', async (req, res, next) => {
  try {
    const plans = await WorkoutPlan.find({
      user: req.user.id,
      active: true,
    })
      .sort({ createdAt: -1 })
      .lean();

    res.json(plans);
  } catch (err) {
    next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const plan = await WorkoutPlan.findOne({
      _id: req.params.id,
      user: req.user.id,
    }).lean();

    if (!plan) {
      return res.status(404).json({
        message: 'Workout plan not found',
      });
    }

    res.json(plan);
  } catch (err) {
    next(err);
  }
});

module.exports = router;