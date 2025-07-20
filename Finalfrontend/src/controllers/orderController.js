// src/controllers/orderController.js
import Order from '../models/Order.js';
import Invoice from '../models/Invoice.js';
import { generateInvoicePDF } from '../services/invoiceService.js';
import { sendOrderNotification } from '../services/emailService.js';
import AuditLog from '../models/AuditLog.js';
import path from 'path';

export async function createOrder(req, res) {
  const data = { ...req.body, client: req.user.id };
  const order = await Order.create(data);

  // Cria fatura
  const invData = {
    order: order._id,
    number: `PHIL-${new Date().getFullYear()}-${Math.floor(1000+Math.random()*9000)}`,
    date: new Date(),
    dueDate: new Date(Date.now() + 14*24*60*60*1000)
  };
  const invoice = await Invoice.create(invData);
  order.invoice = invoice._id;
  await order.save();

  // Gera PDF e salva
  const pdfPath = path.join('invoices', `${invoice.number}.pdf`);
  generateInvoicePDF(invData, pdfPath);
  invoice.filename = pdfPath;
  await invoice.save();

  // Envia email
  await sendOrderNotification(req.user.email, 'Sua solicitação foi recebida', `<p>Olá, sua fatura está em anexo.</p>`);
  await sendOrderNotification('admin@philaseanprovider.co.mz', 'Nova solicitação recebida', `<p>Ordem #${order._id} criada.</p>`);

  await AuditLog.create({ user: req.user.id, action: 'Created order', timestamp: new Date() });
  res.status(201).json({ order, invoice });
}

export async function getMyOrders(req, res) {
  const orders = await Order.find({ client: req.user.id }).populate('invoice');
  res.json(orders);
}
