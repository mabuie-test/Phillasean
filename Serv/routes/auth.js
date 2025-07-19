const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');
const { JWT_SECRET, ADMIN_REG_SECRET } = process.env;

// Registro de cliente
router.post('/register', async (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) 
    return res.status(400).json({ error: 'Campos faltando' });

  if (await User.findOne({ email }))
    return res.status(409).json({ error: 'Email já existe' });

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, password: hash, role: 'client' });
  const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, role: user.role });
});

// Login (cliente ou admin)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  const user = await User.findOne({ email });
  if (!user || !await bcrypt.compare(password, user.password))
    return res.status(401).json({ error: 'Credenciais inválidas' });

  const token = jwt.sign({ id: user._id, role: user.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, role: user.role });
});

// Registro de admin (segredo obrigatório)
router.post('/register-admin', async (req, res) => {
  const { name, email, password, secret } = req.body;
  if (secret !== ADMIN_REG_SECRET) {
    return res.status(403).json({ error: 'Segredo de administração inválido' });
  }
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Campos name, email e password são obrigatórios' });
  }
  if (await User.findOne({ email })) {
    return res.status(409).json({ error: 'Email já cadastrado' });
  }

  const hash = await bcrypt.hash(password, 10);
  const admin = await User.create({ name, email, password: hash, role: 'admin' });
  const token = jwt.sign({ id: admin._id, role: admin.role }, JWT_SECRET, { expiresIn: '7d' });
  res.json({ token, role: admin.role });
});

module.exports = router;
