require('dotenv').config();
const express = require('express');
const cors    = require('cors');
const connectDB = require('./config/db');

const authRoutes  = require('./routes/auth');
const orderRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');

const app = express();
connectDB();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// endpoints
app.use('/api/auth',  authRoutes);
app.use('/api/orders',orderRoutes);
app.use('/api/admin', adminRoutes);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));

