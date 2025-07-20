// src/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/auth.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';

dotenv.config();
await connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth',   authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin',  adminRoutes);

// Pasta estática para servir PDFs de fatura
app.use('/invoices', express.static('invoices'));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
