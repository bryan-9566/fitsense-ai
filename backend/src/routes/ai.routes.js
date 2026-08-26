const router = require('express').Router();
const auth = require('../middleware/auth');
const controller = require('../controllers/ai.controller');
router.use(auth);
router.post('/coach', controller.coachChat);
router.post('/workout-plan', controller.plan);
router.post('/progress', controller.progress);
router.post('/adaptive', controller.adaptive);
module.exports = router;
