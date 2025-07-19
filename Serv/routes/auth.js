const router = require('express').Router();
const bcrypt = require('bcryptjs');
const jwt    = require('jsonwebtoken');
const User   = require('../models/User');
const { JWT_SECRET } = process.env;

// Registro
router.post('/register', async (req,res) => {
  const { name,email,password } = req.body;
  if(!name||!email||!password) 
    return res.status(400).json({ error:'Campos faltando' });

  if(await User.findOne({ email }))
    return res.status(409).json({ error:'Email já existe' });

  const hash = await bcrypt.hash(password, 10);
  const user = await User.create({ name,email,password:hash });
  const token = jwt.sign({ id:user._id,role:user.role }, JWT_SECRET, { expiresIn:'7d' });
  res.json({ token });
});

// Login
router.post('/login', async (req,res) => {
  const { email,password } = req.body;
  const user = await User.findOne({ email });
  if(!user || !await bcrypt.compare(password, user.password))
    return res.status(401).json({ error:'Credenciais inválidas' });

  const token = jwt.sign({ id:user._id,role:user.role }, JWT_SECRET, { expiresIn:'7d' });
  res.json({ token });
});

module.exports = router;
