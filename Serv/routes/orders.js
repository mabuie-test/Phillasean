const router = require('express').Router();
const jwt    = require('jsonwebtoken');
const Order  = require('../models/Order');
const History= require('../models/OrderHistory');
const Invoice= require('../models/Invoice');
const nodemailer = require('nodemailer');
const { JWT_SECRET, EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, ADMIN_EMAIL } = process.env;

// middleware para extrair usuário
function auth(req,res,next){
  const token = req.headers.authorization?.split(' ')[1];
  if(!token) return res.status(401).end();
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).end();
  }
}

// transporter nodemailer
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

// Criar pedido
router.post('/', auth, async (req,res) => {
  if(req.user.role !== 'client') return res.status(403).end();

  const doc = await Order.create({
    client: req.user.id,
    details:{
      service:req.body.service,
      quantity:req.body.quantity,
      notes:req.body.notes,
      vessel:req.body.vessel,
      port:req.body.port,
      estimatedDate:req.body.date
    }
  });

  await History.create({ order:doc._id, status:'pending', by:'client' });

  const reference = `PHIL-${Date.now()}-${Math.floor(Math.random()*9000+1000)}`;
  await Invoice.create({
    order:doc._id, reference,
    dueDate: new Date(Date.now() + 14*24*3600*1000),
    items:[{ name:req.body.service, qty:req.body.quantity, unitPrice:req.body.unitPrice||0 }]
  });

  // envia email
  await transporter.sendMail({
    from: EMAIL_USER,
    to:   ADMIN_EMAIL,
    subject:`Novo pedido ${reference}`,
    html: `<p>Cliente: ${req.body.name || '–'}</p>
           <p>Serviço: ${req.body.service}</p>
           <p>Quantidade: ${req.body.quantity}</p>
           <p>Porto: ${req.body.port}</p>
           <p>Vessel: ${req.body.vessel}</p>
           <p>Referência: ${reference}</p>`
  });

  res.json({ success:true, orderId:doc._id, reference });
});

module.exports = router;
