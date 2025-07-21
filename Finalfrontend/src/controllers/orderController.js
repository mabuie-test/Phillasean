// src/controllers/orderController.js
import path from 'path';
import Order from '../models/Order.js';
import Invoice from '../models/Invoice.js';
import AuditLog from '../models/AuditLog.js';
import { generateInvoicePDF } from '../services/invoiceService.js';
import { sendOrderNotification } from '../services/emailService.js';

// POST /api/orders
export async function createOrder(req, res) {
  try {
    const {
      name, company, email, phone,
      vessel, port, date, services, notes
    } = req.body;

    // 1) Validações básicas
    if (!name || !email || !vessel || !port || !date) {
      return res.status(400).json({ message: 'Campos obrigatórios ausentes.' });
    }
    if (!Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ message: 'Selecione ao menos um serviço.' });
    }

    // 2) Cria a ordem
    const order = await Order.create({
      client: req.user.id,
      name,
      company,
      email,
      phone,
      vessel,
      port,
      date: new Date(date),
      services,
      notes
    });

    // 3) Cria a fatura associada
    const invoiceNumber = `PHIL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const invoice = await Invoice.create({
      order:   order._id,
      number:  invoiceNumber,
      date:    new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    });

    // 4) Associa fatura à ordem
    order.invoice = invoice._id;
    await order.save();

    // 5) Gera PDF da fatura **com dados da ordem**
    const pdfFilename = `${invoiceNumber}.pdf`;
    const pdfPath     = path.join('invoices', pdfFilename);

    // Passa ambos os objetos para o gerador
    await generateInvoicePDF(
      { invoice: invoice.toObject(), order: order.toObject() },
      pdfPath
    );

    invoice.filename = pdfFilename;
    await invoice.save();

    // 6) Envia notificações por email
    const userEmail = req.user.email; // authMiddleware deve popular req.user.email
    await sendOrderNotification(
      userEmail,
      'Sua solicitação foi recebida',
      `<p>Olá ${name},</p>
       <p>Recebemos sua solicitação. Em anexo está sua fatura <strong>${invoiceNumber}</strong>.</p>`,
      pdfPath
    );
    await sendOrderNotification(
      'admin@philaseanprovider.co.mz',
      'Nova solicitação recebida',
      `<p>Ordem <strong>#${order._id}</strong> criada por ${email}.</p>`
    );

    // 7) Registra log de auditoria
    await AuditLog.create({
      user:      req.user.id,
      action:    `Created order ${order._id}`,
      timestamp: new Date()
    });

    // 8) Retorna ordem + fatura populada
    const populatedOrder = await Order.findById(order._id).populate('invoice');
    return res.status(201).json(populatedOrder);

  } catch (err) {
    console.error('Erro no createOrder:', err);
    return res.status(500).json({ message: 'Erro interno ao criar ordem.' });
  }
}

// GET /api/orders
export async function getMyOrders(req, res) {
  try {
    const orders = await Order
      .find({ client: req.user.id })
      .sort({ createdAt: -1 })
      .populate('invoice')
      .lean();
    return res.json(orders);
  } catch (err) {
    console.error('Erro no getMyOrders:', err);
    return res.status(500).json({ message: 'Erro interno ao buscar ordens.' });
  }
}
