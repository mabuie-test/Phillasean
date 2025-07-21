// src/routes/admin.js
import express from 'express';
import {
  listInvoices,
  updateOrderStatus,
  listAdmins,
  createAdmin,
  getAuditLogs
} from '../controllers/adminController.js';
// Se quiser proteger:
import { authMiddleware } from '../middlewares/auth.js';
import { roleMiddleware } from '../middlewares/roles.js';

const router = express.Router();

// Para reabilitar proteção, descomente a linha abaixo:
router.use(authMiddleware, roleMiddleware('admin'));

// Listar faturas (com filtros opcionais)
router.get('/invoices', listInvoices);

// Atualizar status de uma ordem/fatura
router.put('/invoices/:orderId', updateOrderStatus);

// Listar todos os admins
router.get('/admins', listAdmins);

// Criar novo admin
router.post('/admins', createAdmin);

// Logs de auditoria
router.get('/audit', getAuditLogs);

export default router;
