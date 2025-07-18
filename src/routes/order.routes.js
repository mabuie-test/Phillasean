const router = require('express').Router();
const auth   = require('../middlewares/auth.middleware');
const {
  createOrder,
  getOrders    // ← importa a nova ação
} = require('../controllers/order.controller');

// Cria um novo pedido (autenticado)
router.post('/orders', auth, createOrder);

// Lista pedidos de um usuário (autenticado)
router.get('/orders', auth, getOrders);

module.exports = router;
