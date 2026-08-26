const router = require('express').Router();

const auth = require('../middleware/auth');
const controller = require('../controllers/analytics.controller');

router.use(auth);

router.get('/summary', controller.summary);

module.exports = router;
