// src/routes/orders.js
import express from 'express';
import { createOrder, getMyOrders } from '../controllers/orderController.js';
import { authMiddleware } from '../middlewares/auth.js';

const router = express.Router();

// Todas as rotas abaixo exigem usuário autenticado
router.use(authMiddleware);

// Cria nova ordem (POST /api/orders)
router.post('/', createOrder);

// Recupera todas as ordens do usuário (GET /api/orders)
router.get('/', getMyOrders);

export default router;
