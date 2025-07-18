// src/routes/auth.routes.js
const router = require('express').Router();
const { register, login, registerAdmin } = require('../controllers/auth.controller');
const auth = require('../middlewares/auth.middleware');

router.post('/register',       register);
router.post('/login',          login);
// somente um admin já logado pode criar outro:
router.post('/register-admin', auth, registerAdmin);

module.exports = router;
