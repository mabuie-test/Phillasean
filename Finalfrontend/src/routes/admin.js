// src/routes/admin.js
import express from 'express';
import { listInvoices, createAdmin, getAuditLogs } from '../controllers/adminController.js';
// Removido temporariamente: autenticação e autorização
import { authMiddleware } from '../middlewares/auth.js';
import { roleMiddleware } from '../middlewares/roles.js';

const router = express.Router();

// Descomente estas linhas para reabilitar proteção:
 router.use(authMiddleware, roleMiddleware('admin'));

router.get('/invoices', listInvoices);
router.post('/admins',   createAdmin);
router.get('/audit',     getAuditLogs);

export default router;
