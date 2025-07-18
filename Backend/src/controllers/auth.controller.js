const User = require('../models/user');
const jwt  = require('jsonwebtoken');
const nodemailer = require('nodemailer');

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

async function login(req, res) {
  try {
    const { email, password } = req.body;
    const u = await User.findOne({ email });
    if (!u || !(await u.comparePassword(password))) {
      return res.status(401).json({ success: false, message: 'Credenciais inválidas.' });
    }
    const token = jwt.sign({ id: u._id, name: u.name }, process.env.JWT_SECRET, { expiresIn: '8h' });
    res.json({ success: true, token, user: { _id: u._id, name: u.name, email: u.email } });
  } catch {
    res.status(500).json({ success: false, message: 'Erro no login.' });
  }
}

module.exports = { register, login };
