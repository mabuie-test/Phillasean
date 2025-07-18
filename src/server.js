require('dotenv').config();
const express   = require('express');
const cors      = require('cors');
const path      = require('path');
const connectDB = require('./config/db');

const authRoutes  = require('./routes/auth.routes');
const orderRoutes = require('./routes/order.routes');

const app = express();
connectDB();

app.use(cors());
app.use(express.json());

// Serve somente os PDFs gerados (invoices)
// A pasta invoices está na raiz do repositório, ao lado de src/
app.use(
  '/invoices',
  express.static(path.join(__dirname, '..', 'invoices'))
);

// Rotas da API
app.use('/api/auth', authRoutes);
app.use('/api',      orderRoutes);

// Não tentamos servir o public/index.html aqui!
// O front‑end será servido como Static Site no Render.

app.listen(process.env.PORT, () => {
  console.log(`API rodando na porta ${process.env.PORT}`);
});
