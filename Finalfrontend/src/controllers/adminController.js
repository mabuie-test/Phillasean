// src/controllers/adminController.js
import Invoice from '../models/Invoice.js';
import User from '../models/User.js';
import AuditLog from '../models/AuditLog.js';

export async function listInvoices(req, res) {
  const { status, clientEmail, dateFrom, dateTo } = req.query;
  const filter = {};
  if (status)      filter['order.status'] = status;
  if (clientEmail) filter['order.client.email'] = clientEmail;
  // ... completar filters com datas ...
  const invoices = await Invoice.find(filter).populate({
    path: 'order',
    populate: { path: 'client', select: 'email name' }
  });
  res.json(invoices);
}

export async function createAdmin(req, res) {
  const { name, email, password } = req.body;
  // reusar lógica de authController mas definindo role: 'admin'
  // ...
}

export async function getAuditLogs(req, res) {
  const logs = await AuditLog.find().sort({ timestamp: -1 });
  res.json(logs);
}
