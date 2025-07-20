const router      = require('express').Router();
const jwt         = require('jsonwebtoken');
const Order       = require('../models/Order');
const History     = require('../models/OrderHistory');
const Invoice     = require('../models/Invoice');
const nodemailer  = require('nodemailer');
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
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  tls: { rejectUnauthorized: false }
});

transporter.verify(err => {
  if (err) {
    console.error('SMTP config inválida ou credenciais incorretas:', err.message);
  } else {
    console.log('SMTP pronto para enviar emails');
  }
});

// POST /api/orders → criar pedido
router.post('/', auth, async (req, res) => {
  if (req.user.role && req.user.role !== 'client') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  // Criar o pedido, agora com array de services
  const doc = await Order.create({
    client: req.user.id,
    details: {
      services:       req.body.services || [],
      notes:          req.body.notes,
      vessel:         req.body.vessel,
      port:           req.body.port,
      estimatedDate:  req.body.date
    }
  });

  // Histórico inicial
  await History.create({ order: doc._id, status: 'pending', by: 'client' });

  // Gerar fatura
  const reference = `PHIL-${Date.now()}-${Math.floor(Math.random() * 9000 + 1000)}`;
  const dueDate   = new Date(Date.now() + 14 * 24 * 3600 * 1000);
  await Invoice.create({
    order:     doc._id,
    reference,
    dueDate,
    items: [] // não usamos itens detalhados agora
  });

  // Enviar notificação por email
  transporter.sendMail({
    from:    EMAIL_USER,
    to:      ADMIN_EMAIL,
    subject: `Novo pedido ${reference}`,
    html: `
      <p><strong>Cliente:</strong> ${req.body.name || '–'}</p>
      <p><strong>Serviços:</strong><br>${(req.body.services || []).map(s => `• ${s}`).join('<br>')}</p>
      <p><strong>Porto:</strong> ${req.body.port}</p>
      <p><strong>Navio:</strong> ${req.body.vessel}</p>
      <p><strong>Referência:</strong> ${reference}</p>
    `
  }).catch(err => console.error('Falha ao enviar email de notificação:', err.message));

  res.json({ success: true, orderId: doc._id, reference });
});

// GET /api/orders → histórico do cliente
router.get('/', auth, async (req, res) => {
  if (req.user.role && req.user.role !== 'client') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const orders = await Order.find({ client: req.user.id }).sort({ createdAt: -1 });
  const data = await Promise.all(orders.map(async o => {
    const inv = await Invoice.findOne({ order: o._id });
    return {
      id:        o._id,
      services:  o.details.services,
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
  if (req.user.role && !['client','admin'].includes(req.user.role)) {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const order = await Order.findById(req.params.id).lean();
  const inv   = await Invoice.findOne({ order: order._id }).lean();
  if (!order || !inv) {
    return res.status(404).json({ error: 'Factura não encontrada' });
  }

  // Cabeçalhos para PDF
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition',
    `attachment; filename="factura-${inv.reference}.pdf"`
  );

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  // Timbre da empresa
  doc
    .fontSize(20)
    .text('PHIL ASEAN PROVIDER & LOGISTICS', { align: 'center' })
    .moveDown(1);

  // Cabeçalho da Fatura
  doc
    .fontSize(12)
    .text(`Referência: ${inv.reference}`)
    .text(`Data Estimada: ${order.details.estimatedDate.toLocaleDateString()}`)
    .text(`Data de Emissão: ${new Date().toLocaleDateString()}`)
    .text(`Vencimento: ${inv.dueDate.toLocaleDateString()}`)
    .moveDown();

  // Serviços solicitados
  doc.fontSize(14).text('Serviços Solicitados:', { underline: true }).moveDown(0.5);
  order.details.services.forEach(s => {
    doc.fontSize(12).text(`• ${s}`);
  });
  doc.moveDown();

  // Observações
  if (order.details.notes) {
    doc.fontSize(12).text('Observações:', { underline: true }).moveDown(0.3);
    doc.text(order.details.notes).moveDown();
  }

  // Rodapé
  doc
    .fontSize(10)
    .text('Obrigado pela preferência!', { align: 'center' });

  doc.end();
});

module.exports = router;
