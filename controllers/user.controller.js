import User from '../models/user.model.js';
import bcrypt from 'bcrypt';
import { updateProfileSchema } from '../validators/user.validator.js';
import multer from 'multer';

// ✅ Promotion d'un utilisateur en admin
export const promoteToAdmin = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { role: 'admin' } },
      { new: true }
    ).select('-motDePasse');
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.json({ message: 'Utilisateur promu admin', user });
  } catch (e) { next(e); }
};

// ✅ Rétrogradation d'un utilisateur en client
export const demoteToClient = async (req, res, next) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { $set: { role: 'client' } },
      { new: true }
    ).select('-motDePasse');
    if (!user) return res.status(404).json({ message: 'Utilisateur non trouvé' });
    res.json({ message: 'Utilisateur rétrogradé client', user });
  } catch (e) { next(e); }
};
export const listUsers = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;
    const sortOrder = order === 'desc' ? -1 : 1;
    const total = await User.countDocuments();
    const users = await User.find().select('-motDePasse')
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ total, page: parseInt(page), pages: Math.ceil(total / limit), data: users });
  } catch (e) { next(e); }
};
export const getMe = (req, res) => {
  res.json(req.user);
};

export const updateMe = async (req, res, next) => {
  try {
    // 1️⃣ Validation avec Joi
    const { error, value } = updateProfileSchema.validate(req.body, { abortEarly: false });
    if (error) {
      return res.status(400).json({ errors: error.details.map(d => d.message) });
    }

    const updates = { ...value };

    // Interdire la modification du rôle via /me
    if ('role' in updates) delete updates.role;

    // 2️⃣ Hash du mot de passe si fourni
    if (updates.motDePasse) {
      const salt = await bcrypt.genSalt(10);
      updates.motDePasse = await bcrypt.hash(updates.motDePasse, salt);
    }

    // 3️⃣ Mise à jour
    const user = await User.findByIdAndUpdate(
      req.user.id,
      { $set: updates },
      { new: true, runValidators: true }
    ).select('-motDePasse');

    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }

    res.json(user);
  } catch (e) {
    next(e);
  }
};

// ✅ Upload / mise à jour photo de profil
export const uploadPhoto = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Aucune image envoyée" });
    }

    const user = await User.findById(req.user.id).select("-motDePasse");
    if (!user) return res.status(404).json({ message: "Utilisateur non trouvé" });

    // 🔹 si tu stockes en local
    user.photo = `/uploads/${req.file.filename}`;
    await user.save();

    res.status(200).json({ message: "Photo de profil mise à jour", photo: user.photo });
  } catch (e) {
    next(e);
  }
};


export const deleteMe = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json({ message: 'Utilisateur supprimé avec succès' });
  } catch (e) {
    next(e);
  }
};

// ✅ Suppression d'un utilisateur par ID (admin)
export const deleteUserById = async (req, res, next) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) {
      return res.status(404).json({ message: 'Utilisateur non trouvé' });
    }
    res.json({ message: 'Utilisateur supprimé', user: { _id: user._id, email: user.email } });
  } catch (e) {
    next(e);
  }
};