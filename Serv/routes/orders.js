// routes/orders.js

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
  auth: { user: EMAIL_USER, pass: EMAIL_PASS },
  tls: { rejectUnauthorized: false }
});
transporter.verify(err => {
  if (err) console.error('SMTP inválido:', err.message);
  else     console.log('SMTP pronto para enviar emails');
});

// POST /api/orders → criar pedido, salvando telefone
router.post('/', auth, async (req, res) => {
  if (req.user.role && req.user.role !== 'client') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  // normaliza serviços em array
  let services = [];
  if (Array.isArray(req.body.services) && req.body.services.length) {
    services = req.body.services;
  } else if (req.body.service) {
    services = [req.body.service];
  }

  // cria o pedido incluindo phone
  const doc = await Order.create({
    client: req.user.id,
    details: {
      services,
      notes:          req.body.notes,
      vessel:         req.body.vessel,
      port:           req.body.port,
      estimatedDate:  req.body.date,
      phone:          req.body.phone    // ← aqui salvamos o telefone
    }
  });

  // histórico inicial
  await History.create({ order: doc._id, status: 'pending', by: 'client' });

  // gera fatura básica
  const reference = `PHIL-${Date.now()}-${Math.floor(Math.random()*9000+1000)}`;
  const dueDate   = new Date(Date.now() + 14*24*3600*1000);
  await Invoice.create({
    order:     doc._id,
    reference,
    dueDate,
    items:     []  // opcional: detalhes de preço
  });

  // notificação por email
  transporter.sendMail({
    from:    ADMIN_EMAIL, //EMAIL_USER
    to:      ADMIN_EMAIL,
    subject: `Novo pedido ${reference}`,
    html: `
      <p><strong>Cliente:</strong> ${req.body.name || '–'}</p>
      <p><strong>Telefone:</strong> ${req.body.phone || '–'}</p>
      <p><strong>Serviços:</strong><br>${services.map(s => `• ${s}`).join('<br>')}</p>
      <p><strong>Porto:</strong> ${req.body.port}</p>
      <p><strong>Navio:</strong> ${req.body.vessel}</p>
      <p><strong>Referência:</strong> ${reference}</p>
    `
  }).catch(err => console.error('Erro email:', err.message));

  res.json({ success: true, orderId: doc._id, reference });
});

// GET /api/orders → histórico do cliente (inclui telefone se desejar)
router.get('/', auth, async (req, res) => {
  if (req.user.role && req.user.role !== 'client') {
    return res.status(403).json({ error: 'Acesso negado' });
  }

  const orders = await Order.find({ client: req.user.id }).sort({ createdAt: -1 });
  const data = await Promise.all(orders.map(async o => {
    const services = Array.isArray(o.details.services) && o.details.services.length
      ? o.details.services
      : (o.details.service ? [o.details.service] : []);
    const inv = await Invoice.findOne({ order: o._id });
    return {
      id:         o._id,
      services,
      port:       o.details.port,
      vessel:     o.details.vessel,
      date:       o.details.estimatedDate,
      phone:      o.details.phone,      // ← retorna telefone no histórico
      status:     o.status,
      createdAt:  o.createdAt,
      reference:  inv?.reference || null
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

  const services = Array.isArray(order.details.services) && order.details.services.length
    ? order.details.services
    : (order.details.service ? [order.details.service] : []);

  res.setHeader('Content-Type','application/pdf');
  res.setHeader('Content-Disposition',
    `attachment; filename="factura-${inv.reference}.pdf"`
  );

  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(res);

  // Timbre
  doc.fontSize(20).text('PHIL ASEAN PROVIDER & LOGISTICS',{align:'center'}).moveDown(1);

  // Cabeçalho
  doc.fontSize(12)
     .text(`Referência: ${inv.reference}`)
     .text(`Data Estimada: ${order.details.estimatedDate.toLocaleDateString()}`)
     .text(`Data de Emissão: ${new Date().toLocaleDateString()}`)
     .text(`Vencimento: ${inv.dueDate.toLocaleDateString()}`)
     .moveDown();

  // Serviços
  doc.fontSize(14).text('Serviços Solicitados:',{underline:true}).moveDown(0.5);
  services.forEach(s => doc.fontSize(12).text(`• ${s}`));
  doc.moveDown();

  // Observações
  if (order.details.notes) {
    doc.fontSize(12).text('Observações:',{underline:true}).moveDown(0.3);
    doc.text(order.details.notes).moveDown();
  }

  // Rodapé
  doc.fontSize(10).text('Obrigado pela preferência!',{align:'center'});
  doc.end();
});

module.exports = router;
