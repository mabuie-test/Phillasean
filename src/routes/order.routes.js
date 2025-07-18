const router = require('express').Router();
const auth   = require('../middlewares/auth.middleware');
const { createOrder } = require('../controllers/order.controller');

router.post('/orders', auth, createOrder);

module.exports = router;
