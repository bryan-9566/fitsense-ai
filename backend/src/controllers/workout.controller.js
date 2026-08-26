const Workout = require('../models/Workout');

async function create(req, res, next) {
  try {
    const workout = await Workout.create({
      ...req.body,
      user: req.user.id,
    });

    res.status(201).json(workout);
  } catch (err) {
    next(err);
  }
}

async function list(req, res, next) {
  try {
    const page = Math.max(Number(req.query.page) || 1, 1);
    const limit = Math.min(
      Math.max(Number(req.query.limit) || 10, 1),
      50
    );

    const filter = { user: req.user.id };

    if (req.query.category) {
      filter.category = req.query.category;
    }

    const [items, total] = await Promise.all([
      Workout.find(filter)
        .sort({ date: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
      Workout.countDocuments(filter),
    ]);

    res.json({
      items,
      page,
      limit,
      total,
      pages: Math.ceil(total / limit),
    });
  } catch (err) {
    next(err);
  }
}

async function update(req, res, next) {
  try {
    const workout = await Workout.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.id,
      },
      req.body,
      {
        new: true,
        runValidators: true,
      }
    );

    if (!workout) {
      return res.status(404).json({
        message: 'Workout not found',
      });
    }

    res.json(workout);
  } catch (err) {
    next(err);
  }
}

async function remove(req, res, next) {
  try {
    const workout = await Workout.findOneAndDelete({
      _id: req.params.id,
      user: req.user.id,
    });

    if (!workout) {
      return res.status(404).json({
        message: 'Workout not found',
      });
    }

    res.json({
      message: 'Workout deleted',
    });
  } catch (err) {
    next(err);
  }
}

module.exports = {
  create,
  list,
  update,
  remove,
};
