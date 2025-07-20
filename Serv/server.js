require('dotenv').config();
const express    = require('express');
const cors       = require('cors');
const morgan     = require('morgan');
const connectDB  = require('./config/db');
const nodemailer = require('nodemailer');

const authRoutes  = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');

const {
  EMAIL_HOST,
  EMAIL_PORT,
  EMAIL_USER,
  EMAIL_PASS
} = process.env;

// 1) Configura transporter para debug
const transporter = nodemailer.createTransport({
  host: EMAIL_HOST,
  port: EMAIL_PORT,
  auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

transporter.verify(err => {
  if (err) {
    console.error('✉️  SMTP config inválida ou credenciais incorretas:', err);
  } else {
    console.log('✅  SMTP pronto para enviar emails');
  }
});

const app = express();

// 2) Conecta ao MongoDB
connectDB();

// 3) Middlewares
app.use(morgan('tiny'));
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// 4) Rotas
app.use('/api/auth',  authRoutes);
app.use('/api/orders',orderRoutes);
app.use('/api/admin', adminRoutes);

// 5) Erro global
app.use((err, req, res, next) => {
  console.error('Erro não tratado:', err);
  res.status(err.status || 500).json({ error: err.message || 'Erro interno' });
});

// 6) Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);

});
