const Order    = require('../models/Order');
const Invoice  = require('../models/Invoice');
const pdfGen   = require('../utils/pdfGenerator');
const mailer   = require('../config/mailer');

exports.createOrder = async (req, res) => {
  // dados básicos
  const payload = {
    userId: req.user?.id || null,
    name:   req.body.name,
    email:  req.body.email,
    service:req.body.service,
    details:req.body.details || {}
  };
  const order = await new Order(payload).save();

  // gera PDF
  const { pdfPath } = await pdfGen(order);

  // salva invoice
  const invoice = await new Invoice({ orderId: order._id, pdfPath }).save();

  // envia email
  await mailer.sendMail({
    from: process.env.EMAIL_USER,
    to:   process.env.EMAIL_USER,
    subject: `Novo Pedido: ${order.service}`,
    text:    `Pedido ${order.service} de ${order.name}`,
    attachments: [{ path: pdfPath }]
  });

  res.json({ success: true, message: 'Pedido criado', order, invoice });
};
