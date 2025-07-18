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
app.use('/invoices', express.static(path.join(__dirname, '..', 'invoices')));

// API
app.use('/api/auth', authRoutes);
app.use('/api',      orderRoutes);

app.listen(process.env.PORT, () => {
  console.log(`API rodando na porta ${process.env.PORT}`);
});
