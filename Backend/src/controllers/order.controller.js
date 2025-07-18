const Order = require('../models/order');
const nodemailer = require('nodemailer');

async function createOrder(req, res) {
  try {
    const { service, details } = req.body;
    const userId = req.user.id;
    const name   = req.body.name  || req.user.name;
    const email  = req.body.email || req.user.email;
    const order = await Order.create({ userId, name, email, service, details });
    // envia e‑mail institucional
    const transport = nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
    });
    await transport.sendMail({
      from: process.env.EMAIL_USER,
      to: process.env.EMAIL_USER,
      subject: `Nova ordem: ${service}`,
      html: `<p>Pedido de <b>${name}</b> (${email})</p><p>Serviço: ${service}</p>`
    });
    res.status(201).json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erro ao criar pedido.' });
  }
}

async function getOrders(req, res) {
  try {
    const userId = req.query.userId;
    if (req.user.id !== userId) {
      return res.status(403).json({ success: false, message: 'Acesso negado.' });
    }
    const orders = await Order.find({ userId }).sort({ createdAt: -1 }).lean();
    res.json(orders);
  } catch {
    res.status(500).json({ success: false, message: 'Erro ao buscar pedidos.' });
  }
}

module.exports = { createOrder, getOrders };
