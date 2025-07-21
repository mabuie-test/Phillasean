
import Order from '../models/Order.js';

/**
 * Cria uma nova ordem (pedido/reserva) associado ao usuário autenticado.
 */
export const createOrder = async (req, res) => {
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

    // Validação mínima
    if (!name || !email || !vessel || !port || !date || !services?.length) {
      return res.status(400).json({ message: 'Dados incompletos' });
    }

    // Monta e salva a ordem
    const order = new Order({
      client:   req.user.id,   // id vindo do authMiddleware
      name,
      company,
      email,
      phone,
      vessel,
      port,
      date,
      services,
      notes
      // invoice e status ficam nos defaults
    });

    await order.save();

    return res.status(201).json(order);
  } catch (err) {
    console.error('Erro criando ordem:', err);
    return res.status(500).json({ message: 'Erro interno ao criar ordem' });
  }
};

/**
 * Retorna todas as ordens do usuário autenticado, ordenadas pela data de criação.
 */
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ client: req.user.id })
      .sort({ createdAt: -1 })
      .select('-__v'); // remove o campo __v

    return res.status(200).json(orders);
  } catch (err) {
    console.error('Erro ao obter ordens do usuário:', err);
    return res.status(500).json({ message: 'Erro interno ao buscar ordens' });
  }
};
