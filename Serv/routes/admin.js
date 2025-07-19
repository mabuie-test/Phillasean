const router   = require('express').Router();
const jwt      = require('jsonwebtoken');
const Order    = require('../models/Order');
const History  = require('../models/OrderHistory');
const Invoice  = require('../models/Invoice');
const User     = require('../models/User');
const { JWT_SECRET } = process.env;

// Middleware para verificar admin
function authAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Não autorizado' });
  let payload;
  try {
    payload = jwt.verify(token, JWT_SECRET);
  } catch {
    return res.status(401).json({ error: 'Token inválido' });
  }
  if (payload.role !== 'admin') {
    return res.status(403).json({ error: 'Acesso negado' });
  }
  req.user = payload;
  next();
}

// GET /api/admin/orders → lista todos os pedidos com cliente, histórico e referência
router.get('/orders', authAdmin, async (req, res) => {
  try {
    console.log('admin GET /orders by', req.user.id);
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    const data = await Promise.all(orders.map(async o => {
      const user = await User.findById(o.client, 'name email').lean();
      const hist = await History.find({ order: o._id }).sort('changedAt').lean();
      const inv  = await Invoice.findOne({ order: o._id }, 'reference').lean();
      return {
        ...o,
        client:    user || { name: '—', email: '—' },
        history:   hist || [],
        reference: inv?.reference || null
      };
    }));
    res.json(data);
  } catch (err) {
    console.error('admin GET /orders erro:', err);
    res.status(500).json({ error: 'Erro interno ao listar pedidos' });
  }
});

// PUT /api/admin/orders/:id → atualiza status e adiciona ao histórico
router.put('/orders/:id', authAdmin, async (req, res) => {
  const { status } = req.body;
  if (!status) {
    return res.status(400).json({ error: 'Campo status é obrigatório' });
  }
  try {
    console.log(`admin PUT /orders/${req.params.id} status=${status} by ${req.user.id}`);
    const order = await Order.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    ).lean();
    if (!order) {
      return res.status(404).json({ error: 'Pedido não encontrado' });
    }
    await History.create({ order: order._id, status, by: 'admin' });
    res.json({ success: true });
  } catch (err) {
    console.error('admin PUT /orders/:id erro:', err);
    res.status(500).json({ error: 'Erro interno ao atualizar status' });
  }
});

module.exports = router;
