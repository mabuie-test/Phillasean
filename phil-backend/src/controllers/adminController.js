import Invoice from '../models/Invoice.js';
import User    from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import bcrypt   from 'bcryptjs';

export async function listInvoices(req, res) { /* ... filtros ... */ }
export async function createAdmin(req, res) { /* ... */ }
export async function getAuditLogs(req, res) { /* ... */ }
