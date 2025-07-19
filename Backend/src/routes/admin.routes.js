// src/routes/admin.routes.js

const router   = require('express').Router();
const auth     = require('../middlewares/auth.middleware');
const isAdmin  = require('../middlewares/admin.middleware');
const OrderController = require('../controllers/order.controller');

// 3) Listagem de todos os pedidos — apenas admins
//    GET /admin/orders
router.get('/admin/orders', auth, isAdmin, OrderController.listAllOrders);

// 4) (Opcional) Atualizar status de um pedido — apenas admins
//    PATCH /admin/orders/:id/status
router.patch('/admin/orders/:id/status', auth, isAdmin, OrderController.updateStatus);

module.exports = router;
