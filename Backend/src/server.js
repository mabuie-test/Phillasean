// src/server.js
require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const path         = require('path');
const connectDB    = require('./config/db');

const authRoutes   = require('./routes/auth.routes');
const orderRoutes  = require('./routes/order.routes');

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

// 1) Sirva as faturas PDF
app.use(
  '/invoices',
  express.static(path.join(__dirname, 'invoices'))
);

// 2) Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api',      orderRoutes);

// 3) (Opcional) SPA fallback ou rota pública
// app.use(express.static(path.join(__dirname, '..', 'public')));
// app.get('*', (req, res) => {
//   res.sendFile(path.join(__dirname, '..', 'public/index.html'));
// });

const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`API rodando na porta ${PORT}`)
);
