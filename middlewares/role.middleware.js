const roleMiddleware = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ message: 'Accès refusé.' });
  }
  next();
};

export const isAdmin = roleMiddleware('admin');
export default roleMiddleware;
