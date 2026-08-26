const router = require('express').Router();
const auth = require('../middleware/auth');
const controller = require('../controllers/user.controller');
router.use(auth);
router.get('/me', controller.me);
router.put('/me/profile', controller.updateProfile);
module.exports = router;
