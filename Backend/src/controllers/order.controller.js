const Order = require('../models/order');
const nodemailer = require('nodemailer');
const PDFDocument = require('pdfkit');
const path = require('path');
const fs = require('fs');

// transporter nodemailer (preencha com suas vars de ambiente)
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS }
});

// Gera PDF simples e retorna URL pública
async function generateInvoicePDF(order) {
  const doc = new PDFDocument();
  const fileName = `invoice-${order._id}.pdf`;
  const filePath = path.join(__dirname, '..', 'invoices', fileName);
  doc.pipe(fs.createWriteStream(filePath));
  doc.fontSize(20).text('Fatura PHIL ASEAN', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12)
     .text(`Pedido: ${order._id}`)
     .text(`Cliente: ${order.name}`)
     .text(`Email: ${order.email}`)
     .text(`Serviço: ${order.service}`)
     .text(`Detalhes: ${JSON.stringify(order.details)}`)
     .text(`Data: ${order.createdAt.toLocaleString()}`)
     .text(`Status: ${order.status}`);
  doc.end();
  return `/invoices/${fileName}`;
}

async function createOrder(req, res) {
  try {
    const { name, email, service, details } = req.body;
    const order = new Order({
      userId: req.user?.id || null,
      name, email, service, details: details || {}
    });
    // primeiro salva sem invoice
    await order.save();

    // gera invoice e atualiza
    const invoiceUrl = await generateInvoicePDF(order);
    order.invoice = invoiceUrl;
    await order.save();

    // envia email institucional
    await transporter.sendMail({
      from: `"PHIL ASEAN" <${process.env.EMAIL_USER}>`,
      to: process.env.EMAIL_USER,
      subject: `Novo Pedido: ${order._id}`,
      html: `
        <p>Pedido #${order._id}</p>
        <p>Cliente: ${name} (${email})</p>
        <p>Serviço: ${service}</p>
        <p>Detalhes: ${JSON.stringify(details)}</p>
        <p><a href="${process.env.BACKEND_URL}${invoiceUrl}">Baixar fatura</a></p>
      `
    });

    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ success: false, message: 'Erro ao criar pedido.' });
  }
}

// Só admin pode listar todos ou por cliente
async function listOrders(req, res) {
  const filter = {};
  if (req.query.userId) filter.userId = req.query.userId;
  const orders = await Order.find(filter).sort('-createdAt');
  res.json({ success: true, orders });
}

// Só admin pode atualizar status
async function updateStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const order = await Order.findByIdAndUpdate(id, { status }, { new: true });
    return res.json({ success: true, order });
  } catch {
    res.status(400).json({ success: false, message: 'Erro ao atualizar status.' });
  }
}

module.exports = { createOrder, listOrders, updateStatus };
