const Goal = require('../models/Goal');

async function create(req, res, next) {
  try {
    const goal = await Goal.create({ ...req.body, user: req.user.id });
    res.status(201).json(goal);
  } catch (err) { next(err); }
}

async function list(req, res, next) {
  try { res.json(await Goal.find({ user: req.user.id }).sort({ createdAt: -1 }).lean()); } catch (err) { next(err); }
}

async function update(req, res, next) {
  try {
    const goal = await Goal.findOneAndUpdate({ _id: req.params.id, user: req.user.id }, req.body, { new: true, runValidators: true });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    res.json(goal);
  } catch (err) { next(err); }
}

async function remove(req, res, next) {
  try {
    const goal = await Goal.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });
    res.json({ message: 'Goal deleted' });
  } catch (err) { next(err); }
}

module.exports = { create, list, update, remove };
