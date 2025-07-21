import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

export async function register(req, res) {
  const { name, email, password } = req.body;
  if (!name||!email||!password)
    return res.status(400).json({ message:'Campos obrigatórios' });
  let u = await User.findOne({ email });
  if (u) return res.status(400).json({ message:'Email já existe' });
  const hash = await bcrypt.hash(password, 10);
  u = await User.create({ name, email, password:hash });
  res.status(201).json({ message:'Registrado' });
}

export async function login(req, res) {
  const { email, password } = req.body;
  const u = await User.findOne({ email });
  if (!u || !await bcrypt.compare(password, u.password))
    return res.status(401).json({ message:'Credenciais inválidas' });
  const token = jwt.sign(
    { id:u._id, email:u.email, role:u.role },
    process.env.JWT_SECRET,
    { expiresIn: '8h' }
  );
  res.json({ token });
}
