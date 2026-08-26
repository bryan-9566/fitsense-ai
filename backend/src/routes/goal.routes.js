const router = require('express').Router();
const auth = require('../middleware/auth');
const controller = require('../controllers/goal.controller');
router.use(auth);
router.post('/', controller.create);
router.get('/', controller.list);
router.put('/:id', controller.update);
router.delete('/:id', controller.remove);
module.exports = router;
