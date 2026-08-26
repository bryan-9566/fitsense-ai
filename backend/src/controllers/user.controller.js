const User = require('../models/User');

async function me(req, res, next) {
  try {
    const user = await User.findById(req.user.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) { next(err); }
}

async function updateProfile(req, res, next) {
  try {
    const allowed = ['age', 'heightCm', 'weightKg', 'targetWeightKg', 'fitnessGoal', 'experience', 'equipment'];
    const profile = {};
    for (const key of allowed) if (req.body[key] !== undefined) profile[key] = req.body[key];
    const user = await User.findByIdAndUpdate(req.user.id, { $set: { profile } }, { new: true, runValidators: true }).select('-password');
    res.json(user);
  } catch (err) { next(err); }
}

module.exports = { me, updateProfile };
