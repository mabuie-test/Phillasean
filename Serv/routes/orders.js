const router     = require('express').Router();
const jwt        = require('jsonwebtoken');
const Order      = require('../models/Order');
const History    = require('../models/OrderHistory');
const Invoice    = require('../models/Invoice');
const nodemailer = require('nodemailer');
const {
  JWT_SECRET,
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASS,
  ADMIN_EMAIL
} = process.env;

// middleware para extrair e validar JWT
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Não autorizado' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token inválido' });
  }
}

// transporter do Nodemailer
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

// Opcional: verificar SMTP na inicialização
transporter.verify(err => {
  if (err) console.error('SMTP config inválida:', err);
  else     console.log('SMTP pronto para enviar emails');
});

// POST /api/orders → criar pedido
router.post('/', auth, async (req, res) => {
  if (req.user.role !== 'client') return res.status(403).json({ error: 'Acesso negado' });

  // 1) Cria o pedido
  const doc = await Order.create({
    client: req.user.id,
    details: {
      service:       req.body.service,
      quantity:      req.body.quantity,
      notes:         req.body.notes,
      vessel:        req.body.vessel,
      port:          req.body.port,
      estimatedDate: req.body.date
    }
  });
  // 2) Histórico
  await History.create({ order: doc._id, status: 'pending', by: 'client' });
  // 3) Fatura
  const reference = `PHIL-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
  await Invoice.create({
    order:   doc._id,
    reference,
    dueDate: new Date(Date.now() + 14 * 24 * 3600 * 1000),
    items: [{
      name:      req.body.service,
      qty:       req.body.quantity,
      unitPrice: req.body.unitPrice || 0
    }]
  });

  // 4) Envio de email (não bloqueia o fluxo)
  let mailError = null;
  try {
    await transporter.sendMail({
      from:    EMAIL_USER,
      to:      ADMIN_EMAIL,
      subject: `Novo pedido ${reference}`,
      html: `
        <p><strong>Cliente:</strong> ${req.body.name || '–'}</p>
        <p><strong>Serviço:</strong> ${req.body.service}</p>
        <p><strong>Quantidade:</strong> ${req.body.quantity}</p>
        <p><strong>Porto:</strong> ${req.body.port}</p>
        <p><strong>Navio:</strong> ${req.body.vessel}</p>
        <p><strong>Referência:</strong> ${reference}</p>
      `
    });
  } catch (err) {
    console.error('Falha ao enviar email de notificação:', err);
    mailError = err.message;
  }

  // 5) Resposta
  res.json({
    success:   true,
    orderId:   doc._id,
    reference,
    mailError // null se enviado com sucesso, ou string com a mensagem de erro
  });
});

// GET /api/orders → histórico do cliente
router.get('/', auth, async (req, res) => {
  if (req.user.role !== 'client') return res.status(403).json({ error: 'Acesso negado' });
  const orders = await Order.find({ client: req.user.id }).sort({ createdAt: -1 });
  const data = await Promise.all(orders.map(async o => {
    const inv = await Invoice.findOne({ order: o._id });
    return {
      id:        o._id,
      service:   o.details.service,
      quantity:  o.details.quantity,
      port:      o.details.port,
      vessel:    o.details.vessel,
      date:      o.details.estimatedDate,
      status:    o.status,
      createdAt: o.createdAt,
      reference: inv?.reference,
      invoiceId: inv?._id
    };
  }));
  res.json(data);
});

// GET /api/orders/:id/invoice → dados da fatura
router.get('/:id/invoice', auth, async (req, res) => {
  if (req.user.role !== 'client') return res.status(403).json({ error: 'Acesso negado' });
  const inv = await Invoice.findOne({ order: req.params.id });
  if (!inv) return res.status(404).json({ error: 'Factura não encontrada' });
  res.json(inv);
});

module.exports = router;
