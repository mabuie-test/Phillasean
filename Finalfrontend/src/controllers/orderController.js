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

    // validações…
    if (!name || !email || !vessel || !port || !date) {
      return res.status(400).json({ message: 'Campos obrigatórios ausentes.' });
    }
    if (!Array.isArray(services) || services.length === 0) {
      return res.status(400).json({ message: 'Selecione ao menos um serviço.' });
    }

    // cria a ordem
    const order = await Order.create({
      client: req.user.id,
      name, company, email, phone,
      vessel, port,
      date: new Date(date),
      services,
      notes
    });

    // cria a fatura
    const invoiceNumber = `PHIL-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const invoice = await Invoice.create({
      order: order._id,
      number: invoiceNumber,
      date: new Date(),
      dueDate: new Date(Date.now() + 14*24*60*60*1000)
    });

    order.invoice = invoice._id;
    await order.save();

    // **AQUI**: apenas o nome do arquivo
    const pdfFilename = `${invoiceNumber}.pdf`;
    // injeta dados de ordem + fatura no PDF
    await generateInvoicePDF(
      { invoice: invoice.toObject(), order: order.toObject() },
      pdfFilename
    );

    invoice.filename = pdfFilename;
    await invoice.save();

    // envia email ao cliente com nota de progresso
    await sendOrderNotification(
      email,
      'Sua solicitação foi recebida',
      `<p>Olá ${name},</p>
       <p>Sua solicitação foi recebida e a fatura <strong>${invoiceNumber}</strong> foi gerada.</p>
       <p>Verifique o progresso do status da fatura; em breve será processada e entraremos em contato.</p>`,
      // anexa o PDF gerado lá em src/services/invoices
      path.join('invoices', pdfFilename)
    );

    // email para admin
    await sendOrderNotification(
      'Jorgemaabuie@gmail.com,
      'Nova solicitação recebida',
      `<p>Ordem <strong>#${order._id}</strong> criada por ${email}.</p>`
    );

    await AuditLog.create({
      user: req.user.id,
      action: `Created order ${order._id}`,
      timestamp: new Date()
    });

    const populatedOrder = await Order.findById(order._id).populate('invoice');
    return res.status(201).json(populatedOrder);

  } catch (err) {
    console.error('Erro no createOrder:', err);
    return res.status(500).json({ message: 'Erro interno ao criar ordem.' });
  }
}
