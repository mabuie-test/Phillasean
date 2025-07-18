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

// 1) Serve estáticos (front‑end + PDFs)
//    Ajuste: sobe um nível (..), pois __dirname é src/
app.use(
  '/invoices',
  express.static(path.join(__dirname, '..', 'invoices'))
);
app.use(
  express.static(path.join(__dirname, '..', 'public'))
);

// 2) API
app.use('/api/auth', authRoutes);
app.use('/api',       orderRoutes);

// 3) SPA fallback: qualquer outra rota envia o index.html do front‑end
app.get('*', (req, res) => {
  res.sendFile(
    path.join(__dirname, '..', 'public', 'index.html')
  );
});

app.listen(process.env.PORT, () => {
  console.log(`API rodando na porta ${process.env.PORT}`);
});
