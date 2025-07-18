// src/routes/order.routes.js
const router   = require('express').Router();
const auth     = require('../middlewares/auth.middleware');
const isAdmin  = require('../middlewares/admin.middleware');
const {
  createOrder,
  listOrders,     // renomeei getOrders → listOrders
  updateStatus    // opcional: se quiser suportar PATCH /orders/:id/status
} = require('../controllers/order.controller');

// 1) Criação de pedido aberta a todos
router.post('/orders', createOrder);

// 2) Listagem de pedidos (somente admin)
router.get('/orders', auth, isAdmin, listOrders);

// 3) (Opcional) Atualizar status de um pedido
// router.patch('/orders/:id/status', auth, isAdmin, updateStatus);

module.exports = router;
