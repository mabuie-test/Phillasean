import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import authRoutes  from './routes/auth.js';
import orderRoutes from './routes/orders.js';
import adminRoutes from './routes/admin.js';
import { connectDB } from './config/db.js';

dotenv.config();
await connectDB();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/auth',   authRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin',  adminRoutes);

// serve PDFs gerados
const __filename = fileURLToPath(import.meta.url);
const __dirname  = path.dirname(__filename);
app.use(
  '/invoices',
  express.static(path.join(__dirname, '..', 'invoices'))
);

app.listen(process.env.PORT||5000, ()=>
  console.log('🚀 Backend rodando na porta', process.env.PORT||5000)
);
