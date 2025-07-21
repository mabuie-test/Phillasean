import express from 'express';
import { createOrder, getMyOrders } from '../controllers/orderController.js';
import { authMiddleware } from '../middlewares/auth.js';
const r = express.Router();
r.use(authMiddleware);
r.post('/', createOrder);
r.get('/',  getMyOrders);
export default r;
