const router     = require('express').Router();
const jwt        = require('jsonwebtoken');
const Order      = require('../models/Order');
const History    = require('../models/OrderHistory');
const Invoice    = require('../models/Invoice');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
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
  if (!token) {
    console.warn('auth: token ausente');
    return res.status(401).json({ error: 'Não autorizado' });
  }
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    console.log('auth: usuário', req.user);
    next();
  } catch (err) {
    console.error('auth: token inválido', err);
    res.status(401).json({ error: 'Token inválido' });
  }
}

// transporter do Nodemailer
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS
  },
  tls: {
    // ignora erros de certificado mismatched
    rejectUnauthorized: false
  }
});
transporter.verify(err => {
  if (err) {
    console.error('SMTP config inválida:', err.message);
  } else {
    console.log('SMTP pronto para enviar emails');
  }
});


// POST /api/orders → criar pedido
router.post('/', auth, async (req, res) => {
  console.log('POST /api/orders by', req.user);
  if (req.user.role && req.user.role !== 'client') {
    console.warn('POST /api/orders bloqueado para role', req.user.role);
    return res.status(403).json({ error: 'Acesso negado' });
  }

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
  await History.create({ order: doc._id, status: 'pending', by: 'client' });

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

  res.json({
    success:   true,
    orderId:   doc._id,
    reference,
    mailError
  });
});

// GET /api/orders → histórico do cliente
router.get('/', auth, async (req, res) => {
  console.log('GET /api/orders by', req.user);
  if (req.user.role && req.user.role !== 'client') {
    console.warn('GET /api/orders bloqueado para role', req.user.role);
    return res.status(403).json({ error: 'Acesso negado' });
  }

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
      reference: inv?.reference || null
    };
  }));
  res.json(data);
});

// GET /api/orders/:id/invoice → gera e envia PDF
router.get('/:id/invoice', auth, async (req, res) => {
  console.log('GET /api/orders/:id/invoice by', req.user);
  // permite clients e admins
  if (req.user.role && req.user.role !== 'client' && req.user.role !== 'admin') {
    console.warn('GET invoice bloqueado para role', req.user.role);
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const inv = await Invoice.findOne({ order: req.params.id });
  if (!inv) {
    console.warn('Invoice não encontrada para order', req.params.id);
    return res.status(404).json({ error: 'Factura não encontrada' });
  }

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="factura-${inv.reference}.pdf"`);

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  doc.fontSize(20).text('FATURA', { align: 'center' }).moveDown();
  doc.fontSize(12)
    .text(`Referência: ${inv.reference}`)
    .text(`Data de Emissão: ${new Date().toLocaleDateString()}`)
    .text(`Vencimento: ${inv.dueDate.toLocaleDateString()}`)
    .moveDown();
  doc.fontSize(14).text('Itens:', { underline: true }).moveDown(0.5);
  inv.items.forEach(item => {
    doc.fontSize(12).text(`${item.name}: ${item.qty} × ${item.unitPrice.toFixed(2)} = ${(item.qty * item.unitPrice).toFixed(2)}`);
  });
  const total = inv.items.reduce((sum, i) => sum + i.qty * i.unitPrice, 0);
  doc.fontSize(14).text(`Total: ${total.toFixed(2)}`, { align: 'right' }).moveDown(2);
  doc.fontSize(10).text('Obrigado pela preferência!', { align: 'center' });

  doc.end();
});

module.exports = router;
