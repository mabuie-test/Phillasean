// src/controllers/adminController.js
import path from 'path';
import Invoice from '../models/Invoice.js';
import User    from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import bcrypt  from 'bcryptjs';

/**
 * GET /api/admin/invoices
 * Opções de filtro via query string:
 *  - status (string)
 *  - clientEmail (string)
 *  - dateFrom (YYYY-MM-DD)
 *  - dateTo   (YYYY-MM-DD)
 */
export async function listInvoices(req, res) {
  try {
    const { status, clientEmail, dateFrom, dateTo } = req.query;
    const filter = {};

    if (status) {
      filter['order.status'] = status;
    }
    if (clientEmail) {
      filter['order.client.email'] = clientEmail;
    }
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo)   filter.date.$lte = new Date(dateTo);
    }

    const invoices = await Invoice
      .find(filter)
      .populate({
        path: 'order',
        populate: { path: 'client', select: 'name email' }
      })
      .sort({ date: -1 });

    return res.json(invoices);
  } catch (err) {
    console.error('Erro em listInvoices:', err);
    return res.status(500).json({ message: 'Erro interno ao listar faturas.' });
  }
}

/**
 * POST /api/admin/admins
 * Cria um novo usuário com role 'admin'.
 * Body: { name, email, password }
 */
export async function createAdmin(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nome, email e senha são obrigatórios.' });
    }

    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Email já cadastrado.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    const newAdmin = await User.create({
      name,
      email,
      password: hash,
      role: 'admin'
    });

    await AuditLog.create({
      user:      req.user?.id || newAdmin._id,
      action:    `Created admin ${newAdmin._id}`,
      timestamp: new Date()
    });

    return res.status(201).json({
      _id:  newAdmin._id,
      name: newAdmin.name,
      email: newAdmin.email,
      role: newAdmin.role
    });

  } catch (err) {
    console.error('Erro em createAdmin:', err);
    return res.status(500).json({ message: 'Erro interno ao criar administrador.' });
  }
}

/**
 * GET /api/admin/audit
 * Retorna todos os logs de auditoria em ordem decrescente de timestamp
 */
export async function getAuditLogs(req, res) {
  try {
    const logs = await AuditLog
      .find()
      .sort({ timestamp: -1 })
      .populate({ path: 'user', select: 'name email' })
      .lean();
    return res.json(logs);
  } catch (err) {
    console.error('Erro em getAuditLogs:', err);
    return res.status(500).json({ message: 'Erro interno ao buscar logs.' });
  }
}
