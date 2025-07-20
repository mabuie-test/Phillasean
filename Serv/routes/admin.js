// routes/admin.js
const router   = require('express').Router();
const jwt      = require('jsonwebtoken');
const bcrypt   = require('bcryptjs');
const Order    = require('../models/Order');
const History  = require('../models/OrderHistory');
const Invoice  = require('../models/Invoice');
const User     = require('../models/User');
const Audit    = require('../models/Audit');
const { JWT_SECRET, ADMIN_REG_SECRET } = process.env;

// valida admin
function authAdmin(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Não autorizado' });
  let payload;
  try { payload = jwt.verify(token, JWT_SECRET); }
  catch { return res.status(401).json({ error: 'Token inválido' }); }
  if (payload.role !== 'admin') return res.status(403).json({ error: 'Acesso negado' });
  req.user = payload;
  next();
}

// listar pedidos
router.get('/orders', authAdmin, async (req, res) => {
  const orders = await Order.find().sort({createdAt:-1}).lean();
  const data = await Promise.all(orders.map(async o => {
    const user = await User.findById(o.client,'name email').lean();
    const hist = await History.find({order:o._id}).sort('createdAt').lean();
    const inv  = await Invoice.findOne({order:o._id},'reference').lean();
    return {
      ...o,
      client:    user,
      history:   hist,
      services:  o.details.services,
      reference: inv?.reference || null
    };
  }));
  res.json(data);
});

// atualizar status
router.put('/orders/:id', authAdmin, async (req, res) => {
  const { status } = req.body;
  if (!status) return res.status(400).json({error:'Status obrigatório'});
  const order = await Order.findByIdAndUpdate(req.params.id,{status},{new:true}).lean();
  if (!order) return res.status(404).json({error:'Pedido não encontrado'});
  await History.create({order:order._id,status,by:'admin'});
  res.json({success:true});
});

// listar admins
router.get('/users', authAdmin, async (req, res) => {
  const admins = await User.find({role:'admin'},'name email createdAt').lean();
  res.json(admins);
});

// criar admin
router.post('/users', authAdmin, async (req, res) => {
  const {name,email,password,secret} = req.body;
  if (secret !== ADMIN_REG_SECRET) return res.status(403).json({error:'Segredo inválido'});
  if (!name||!email||!password) return res.status(400).json({error:'Campos obrigatórios'});
  if (await User.findOne({email})) return res.status(409).json({error:'Email já existe'});
  const hash = await bcrypt.hash(password,10);
  const user = await User.create({name,email,password:hash,role:'admin'});
  await Audit.create({admin:req.user.id,action:'create-admin',target:user._id});
  res.json({success:true,id:user._id,name:user.name,email:user.email});
});

// remover admin
router.delete('/users/:id', authAdmin, async (req, res) => {
  const target = await User.findById(req.params.id);
  if (!target||target.role!=='admin') return res.status(404).json({error:'Não encontrado'});
  await User.deleteOne({_id:target._id});
  await Audit.create({admin:req.user.id,action:'delete-admin',target:target._id});
  res.json({success:true});
});

// logs de auditoria
router.get('/audit', authAdmin, async (req, res) => {
  const logs = await Audit.find()
    .sort({ createdAt:-1 })
    .limit(100)
    .populate('admin','name email')
    .populate('target','name email')
    .lean();
  res.json(logs);
});

module.exports = router;
