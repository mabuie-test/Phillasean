import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
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

// 1) Determine o caminho absoluto da pasta de faturas
const __dirname = path.resolve();  
const invoicesPath = path.join(
  __dirname,
  'src',
  'services',
  'invoices'
);

// 2) Sirva os PDFs a partir desse diretório
app.use('/invoices', express.static(invoicesPath));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Servidor rodando na porta ${PORT}`));
