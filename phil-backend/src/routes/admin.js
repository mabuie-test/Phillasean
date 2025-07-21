import express from 'express';
import {
  listInvoices,
  createAdmin,
  getAuditLogs
} from '../controllers/adminController.js';
import { authMiddleware } from '../middlewares/auth.js';
import { roleMiddleware } from '../middlewares/roles.js';

const r = express.Router();
r.use(authMiddleware, roleMiddleware('admin'));
r.get('/invoices', listInvoices);
r.post('/admins',   createAdmin);
r.get('/audit',     getAuditLogs);
export default r;

