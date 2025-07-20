// src/routes/orders.js
import express from 'express';
import { createOrder, getMyOrders } from '../controllers/orderController.js';
import { authMiddleware } from '../middlewares/auth.js';
const router = express.Router();
router.use(authMiddleware);
router.post('/', createOrder);
router.get('/',  getMyOrders);
export default router;
