const router = require('express').Router();
const auth = require('../middleware/auth');
const requireRole = require('../middleware/role');
const controller = require('../controllers/admin.controller');
router.use(auth, requireRole('ADMIN'));
router.get('/stats', controller.stats);
router.get('/users', controller.users);
module.exports = router;
