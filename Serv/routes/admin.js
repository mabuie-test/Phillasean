// routes/admin.js
//Mtech
const router   = require('express').Router();
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');
const Order    = require('../models/Order');
const History  = require('../models/OrderHistory');
const Invoice  = require('../models/Invoice');
const User     = require('../models/User');
const Audit    = require('../models/Audit');
const { JWT_SECRET, ADMIN_REG_SECRET } = process.env;

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

// GET /api/admin/orders → lista todos os pedidos com cliente, telefone, serviços, histórico e referência
router.get('/orders', authAdmin, async (req, res) => {
  try {
    console.log('admin GET /orders by', req.user.id);
    const orders = await Order.find().sort({ createdAt: -1 }).lean();
    const data = await Promise.all(orders.map(async o => {
      // busca dados do cliente
      const user = await User.findById(o.client, 'name email').lean();
      // histórico de status
      const hist = await History.find({ order: o._id }).sort('changedAt').lean();
      // referência da fatura
      const inv  = await Invoice.findOne({ order: o._id }, 'reference').lean();

      // monta lista de serviços (compatível com migração de campo único para array)
      const services = Array.isArray(o.details.services) && o.details.services.length
        ? o.details.services
        : (o.details.service ? [o.details.service] : []);

      return {
        _id:        o._id,
        client:     user || { name: '—', email: '—' },
        phone:      o.details.phone || '—',
        services,                                       // <-- aqui
        status:     o.status,
        history:    hist || [],
        reference:  inv?.reference || null,
        createdAt:  o.createdAt
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

// --------------------------------------------------
// Gestão de administradores
// --------------------------------------------------

// GET /api/admin/users → lista todos administradores
router.get('/users', authAdmin, async (req, res) => {
  try {
    const admins = await User.find({ role: 'admin' }, 'name email createdAt').lean();
    res.json(admins);
  } catch (err) {
    console.error('admin GET /users erro:', err);
    res.status(500).json({ error: 'Erro interno ao listar administradores' });
  }
});

// POST /api/admin/users → cria novo admin
router.post('/users', authAdmin, async (req, res) => {
  const { name, email, password, secret } = req.body;
  if (secret !== ADMIN_REG_SECRET) {
    return res.status(403).json({ error: 'Segredo de administração inválido' });
  }
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Campos name, email e password são obrigatórios' });
  }
  if (await User.findOne({ email })) {
    return res.status(409).json({ error: 'Email já cadastrado' });
  }
  try {
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash, role: 'admin' });
    // registra auditoria
    await Audit.create({ admin: req.user.id, action: 'create-admin', target: user._id });
    res.json({ success: true, id: user._id, name: user.name, email: user.email });
  } catch (err) {
    console.error('admin POST /users erro:', err);
    res.status(500).json({ error: 'Erro interno ao criar administrador' });
  }
});

// DELETE /api/admin/users/:id → remove admin
router.delete('/users/:id', authAdmin, async (req, res) => {
  try {
    const target = await User.findById(req.params.id);
    if (!target || target.role !== 'admin') {
      return res.status(404).json({ error: 'Administrador não encontrado' });
    }
    await User.deleteOne({ _id: target._id });
    // registra auditoria
    await Audit.create({ admin: req.user.id, action: 'delete-admin', target: target._id });
    res.json({ success: true });
  } catch (err) {
    console.error('admin DELETE /users/:id erro:', err);
    res.status(500).json({ error: 'Erro interno ao remover administrador' });
  }
});

// --------------------------------------------------
// Logs de auditoria
// --------------------------------------------------

// GET /api/admin/audit → lista logs de auditoria
router.get('/audit', authAdmin, async (req, res) => {
  try {
    const logs = await Audit.find()
      .sort({ timestamp: -1 })
      .limit(100)
      .populate('admin', 'name email')
      .populate('target', 'name email')
      .lean();
    res.json(logs);
  } catch (err) {
    console.error('admin GET /audit erro:', err);
    res.status(500).json({ error: 'Erro interno ao listar auditoria' });
  }
});

module.exports = router;
