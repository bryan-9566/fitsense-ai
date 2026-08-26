const {
  getAnalytics,
} = require('../services/analytics.service');

async function summary(req, res, next) {
  try {
    const data = await getAnalytics(req.user.id);
    res.json(data);
  } catch (err) {
    next(err);
  }
}

module.exports = { summary };
