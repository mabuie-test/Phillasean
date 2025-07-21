// src/controllers/adminController.js
import Invoice from '../models/Invoice.js';
import User    from '../models/User.js';
import AuditLog from '../models/AuditLog.js';
import bcrypt  from 'bcryptjs';

/**
 * POST /api/admin/admins
 * Cria um novo usuário com role 'admin'.
 * Body: { name, email, password }
 */
export async function createAdmin(req, res) {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ message: 'Nome, email e senha são obrigatórios.' });
    }

    // Verifica se já existe
    const exists = await User.findOne({ email });
    if (exists) {
      return res.status(400).json({ message: 'Email já cadastrado.' });
    }

    // Hasheia a senha
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    // Cria usuário com role 'admin'
    const newAdmin = await User.create({
      name,
      email,
      password: hash,
      role: 'admin'
    });

    // Log de auditoria — usa req.user.id se existir, senão atribui newAdmin._id
    await AuditLog.create({
      user:      req.user?.id || newAdmin._id,
      action:    `Created admin ${newAdmin._id}`,
      timestamp: new Date()
    });

    // Retorna dados sem a senha
    return res.status(201).json({
      _id:  newAdmin._id,
      name: newAdmin.name,
      email: newAdmin.email,
      role: newAdmin.role
    });

  } catch (err) {
    console.error('Erro em createAdmin:', err);
    return res.status(500).json({ message: 'Erro interno ao criar administrador.' });
  }
}
