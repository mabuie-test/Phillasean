const Order = require('../models/order');

// POST /api/orders
async function createOrder(req, res) {
  try {
    const { service, details } = req.body;
    const userId = req.user.id;            // vindo do middleware auth
    const name   = req.body.name || req.user.name;
    const email  = req.body.email || req.user.email;

    const order = await Order.create({
      userId,
      name,
      email,
      service,
      details
    });

    // aqui você pode disparar o envio de e‑mail e gerar fatura...
    
    res.status(201).json({ success: true, order });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erro ao criar pedido.' });
  }
}

// GET /api/orders?userId=…
async function getOrders(req, res) {
  try {
    const userId = req.query.userId;
    if (!userId) {
      return res.status(400).json({ success: false, message: 'Falta userId.' });
    }
    // opcional: garanta que req.user.id === userId para não permitir vazamento
    if (req.user.id !== userId) {
      return res.status(403).json({ success: false, message: 'Acesso negado.' });
    }

    const orders = await Order.find({ userId })
                              .sort({ createdAt: -1 })
                              .lean();
    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Erro ao buscar pedidos.' });
  }
}

module.exports = { createOrder, getOrders };
