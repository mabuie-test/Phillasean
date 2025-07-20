// src/controllers/authController.js
import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import AuditLog from '../models/AuditLog.js';

export async function register(req, res) {
  const { name, email, password } = req.body;
  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hash });
  await AuditLog.create({ user: email, action: 'Created account', timestamp: new Date() });
  res.status(201).json({ msg: 'Registrado com sucesso!' });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !(await bcrypt.compare(password, user.password)))
    return res.status(401).json({ msg: 'Credenciais inválidas' });
  const token = jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '12h' });
  await AuditLog.create({ user: email, action: 'Logged in', timestamp: new Date() });
  res.json({ token });
}
