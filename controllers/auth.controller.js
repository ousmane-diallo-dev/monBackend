import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';

const signToken = (user) => jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });

export const register = async (req, res, next) => {
  try {
    const { nom, prenom, email, motDePasse, role } = req.body;
    const exists = await User.findOne({ email });
    if (exists) return res.status(400).json({ message: 'Email déjà utilisé' });
    const user = new User({ nom, prenom, email, motDePasse, role });
    await user.save();
    const token = signToken(user);
    res.status(201).json({ token, user: { id: user._id, nom, prenom, email, role: user.role } });
  } catch (e) { next(e); }
};

export const login = async (req, res, next) => {
  try {
    const { email, motDePasse } = req.body;
    const user = await User.findOne({ email });
    if (!user) return res.status(401).json({ message: 'Identifiants invalides' });
    const ok = await user.comparePassword(motDePasse);
    if (!ok) return res.status(401).json({ message: 'Identifiants invalides' });
    const token = signToken(user);
    res.json({ token, user: { id: user._id, nom: user.nom, prenom: user.prenom, email, role: user.role } });
  } catch (e) { next(e); }
};

export const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-motDePasse');
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.json(user);
  } catch (e) { next(e); }
};
