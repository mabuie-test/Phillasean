// src/routes/order.routes.js

const router  = require('express').Router();
const auth    = require('../middlewares/auth.middleware');
const OrderController = require('../controllers/order.controller');

// 1) Criação de pedido — apenas clients autenticados
//    POST /orders
router.post('/orders', auth, OrderController.createOrder);

// 2) Histórico de pedidos do cliente — apenas clients autenticados
//    GET /orders
router.get('/orders', auth, OrderController.listClientOrders);

module.exports = router;
