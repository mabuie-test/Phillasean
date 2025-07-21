// src/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';
import authRoutes  from './routes/auth.js';
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

// Resolve __dirname correto
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);

// Agora serve exatamente a pasta raiz "/invoices"
const invoicesStatic = path.join(__dirname, '..', 'invoices');
console.log('Servindo faturas de:', invoicesStatic);
app.use('/invoices', express.static(invoicesStatic));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor na porta ${PORT}`));
