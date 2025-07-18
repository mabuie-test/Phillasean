// src/middlewares/admin.middleware.js
module.exports = function isAdmin(req, res, next) {
  // req.user vem do auth.middleware que decodifica o JWT
  if (req.user && req.user.role === 'admin') {
    return next();
  }
  return res.status(403).json({
    success: false,
    message: 'Acesso negado: apenas admins.'
  });
};
