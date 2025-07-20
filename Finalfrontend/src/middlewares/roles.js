// src/middlewares/roles.js
export function roleMiddleware(requiredRole) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ msg: 'Não autenticado' });
    }
    if (req.user.role !== requiredRole) {
      return res.status(403).json({ msg: 'Permissão negada' });
    }
    next();
  };
}
