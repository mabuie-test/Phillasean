const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const Order  = require('../models/Order');
const History= require('../models/OrderHistory');
const { JWT_SECRET } = process.env;

function authAdmin(req,res,next){
  const token = req.headers.authorization?.split(' ')[1];
  if(!token) return res.status(401).end();
  const user = jwt.verify(token, JWT_SECRET);
  if(user.role !== 'admin') return res.status(403).end();
  next();
}

// Listar todos pedidos
router.get('/orders', authAdmin, async (req,res) => {
  const orders = await Order.find().sort({ createdAt:-1 }).populate('client','name email');
  res.json(orders);
});

// Atualizar status
router.put('/orders/:id', authAdmin, async (req,res) => {
  const { status } = req.body;
  const order = await Order.findByIdAndUpdate(req.params.id,{ status },{ new:true });
  await History.create({ order:order._id, status, by:'admin' });
  res.json({ success:true });
});

module.exports = router;
