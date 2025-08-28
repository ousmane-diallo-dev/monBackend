import jwt from 'jsonwebtoken';
import User from '../models/user.model.js';

export default async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Accès refusé. Token manquant.' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Charger le rôle actuel depuis la BD (évite d'utiliser un rôle obsolète dans le token)
    const user = await User.findById(decoded.id).select('role email nom prenom photo');
    if (!user) return res.status(401).json({ message: 'Utilisateur introuvable.' });

    req.user = {
      id: decoded.id,
      role: user.role,
      email: user.email,
      nom: user.nom,
      prenom: user.prenom,
      photo: user.photo
    };

    next();
  } catch (e) {
    return res.status(401).json({ message: 'Token invalide.' });
  }
};
