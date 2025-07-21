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
      name,
      company,
      email,
      phone,
      vessel,
      port,
      date,
      services,
      notes
    } = req.body;

    // 1) Validações básicas
    if (!name || !email || !vessel || !port || !date) {
      return res.status(400).json({ message: 'Campos obrigatórios ausentes.' });
    }
    if (!Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ message: 'Selecione ao menos um serviço.' });
    }

    // 2) Cria a ordem no banco
    const order = await Order.create({
      client:  req.user.id,
      name,
      company,
      email,
      phone,
      vessel,
      port,
      date:    new Date(date),
      services,
      notes
    });

    // 3) Cria o documento de fatura
    const invoiceNumber = `PHIL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const invoice = await Invoice.create({
      order:   order._id,
      number:  invoiceNumber,
      date:    new Date(),
      dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
    });

    // 4) Associa a fatura à ordem e salva
    order.invoice = invoice._id;
    await order.save();

    // 5) Gera o PDF — aqui passa apenas o nome do arquivo
    const pdfFilename = `${invoiceNumber}.pdf`;
    await generateInvoicePDF(
      { invoice: invoice.toObject(), order: order.toObject() },
      pdfFilename
    );

    // 6) Atualiza o campo filename na fatura e salva
    invoice.filename = pdfFilename;
    await invoice.save();

    // 7) Envia email ao cliente com nota de progresso
    await sendOrderNotification(
      email,
      'Sua solicitação foi recebida',
      `<p>Olá ${name},</p>
       <p>Sua solicitação foi recebida e a fatura <strong>${invoiceNumber}</strong> foi gerada.</p>
       <p>Verifique o progresso do status da fatura; em breve será processada e entraremos em contato.</p>`,
      pdfFilename
    );

    // 8) Envia notificação ao admin
    await sendOrderNotification(
      'admin@philaseanprovider.co.mz',
      'Nova solicitação recebida',
      `<p>Ordem <strong>#${order._id}</strong> criada por ${email}.</p>`
    );

    // 9) Grava log de auditoria
    await AuditLog.create({
      user:      req.user.id,
      action:    `Created order ${order._id}`,
      timestamp: new Date()
    });

    // 10) Retorna resposta com ordem populada (incluindo invoice)
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
