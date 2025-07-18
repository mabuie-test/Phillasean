const router = require('express').Router();
const auth   = require('../middlewares/auth.middleware');
const { createOrder, getOrders } = require('../controllers/order.controller');
router.post('/orders', auth, createOrder);
router.get ('/orders', auth, getOrders);
module.exports = router;
