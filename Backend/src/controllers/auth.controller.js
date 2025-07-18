// src/controllers/auth.controller.js
const User = require('../models/user');
const jwt  = require('jsonwebtoken');

// Registra um usuário comum
async function register(req, res) {
  try {
    const { name, email, password } = req.body;
    const u = new User({ name, email, password });
    await u.save();
    res.json({ success: true, message: 'Registrado com sucesso.' });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Erro no registro.' });
  }
}

// Realiza o login e retorna JWT + dados do usuário
async function login(req, res) {
  try {
    const { email, password } = req.body;
    const u = await User.findOne({ email });
    if (!u || !(await u.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Credenciais inválidas.' });
    }
    const token = jwt.sign(
      { id: u._id, name: u.name, role: u.role },
      process.env.JWT_SECRET,
      { expiresIn: '8h' }
    );
    res.json({
      success: true,
      token,
      user: { _id: u._id, name: u.name, email: u.email, role: u.role }
    });
  } catch {
    res.status(500).json({ success: false, message: 'Erro no login.' });
  }
}

/**
 * Registra um usuário com role="admin",
 * somente se enviado o adminKey correto.
 */
async function registerAdmin(req, res) {
  const { name, email, password, adminKey } = req.body;
  if (adminKey !== process.env.ADMIN_KEY) {
    return res.status(403).json({ success: false, message: 'Chave ADMIN inválida.' });
  }
  try {
    const u = new User({ name, email, password, role: 'admin' });
    await u.save();
    res.json({ success: true, message: 'Admin registrado com sucesso.' });
  } catch (err) {
    res.status(400).json({ success: false, message: 'Erro no registro de admin.' });
  }
}

module.exports = { register, login, registerAdmin };
