import User from '../models/user.model.js';
import jwt from 'jsonwebtoken';

const signToken = (user) => jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });

export const register = async (req, res, next) => {
  try {
    const { nom, prenom, email, motDePasse, role } = req.body;
    
    // Validation des champs requis
    if (!nom || !email || !motDePasse) {
      return res.status(400).json({ 
        message: 'Les champs nom, email et mot de passe sont requis' 
      });
    }

    // Vérifier si l'email existe déjà
    const exists = await User.findOne({ email: email.toLowerCase() });
    if (exists) {
      return res.status(400).json({ 
        message: 'Cette adresse email est déjà utilisée. Veuillez utiliser une autre adresse ou vous connecter.' 
      });
    }

    // Gérer l'upload de photo
    let photoUrl = undefined;
    if (req.file) {
      photoUrl = `/uploads/${req.file.filename}`;
    }

    // Créer le nouvel utilisateur
    const user = new User({ 
      nom: nom.trim(), 
      prenom: prenom ? prenom.trim() : nom.trim(), // Utiliser le nom si pas de prénom
      email: email.trim().toLowerCase(), 
      motDePasse, 
      role: role || 'client', 
      photo: photoUrl 
    });

    await user.save();

    // Générer le token JWT
    const token = signToken(user);

    // Retourner la réponse avec _id au lieu de id
    res.status(201).json({ 
      token, 
      user: { 
        _id: user._id, 
        nom: user.nom, 
        prenom: user.prenom, 
        email: user.email, 
        role: user.role, 
        photo: user.photo 
      } 
    });

  } catch (error) {
    console.error('Erreur lors de l\'inscription:', error);
    
    // Gestion des erreurs de validation Mongoose
    if (error.name === 'ValidationError') {
      const validationErrors = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({ 
        message: 'Données de validation invalides: ' + validationErrors.join(', '), 
        errors: validationErrors 
      });
    }

    // Gestion des erreurs de duplication
    if (error.code === 11000) {
      return res.status(400).json({ 
        message: 'Cette adresse email est déjà utilisée' 
      });
    }

    // Gestion des erreurs génériques avec plus de détails
    res.status(500).json({ 
      message: 'Erreur serveur lors de l\'inscription: ' + error.message 
    });
  }
};

export const login = async (req, res, next) => {
  try {
    const { email, motDePasse } = req.body;
    
    // Rechercher l'utilisateur par email
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ 
        message: 'Email ou mot de passe incorrect' 
      });
    }

    // Vérifier le mot de passe
    const isPasswordValid = await user.comparePassword(motDePasse);
    if (!isPasswordValid) {
      return res.status(401).json({ 
        message: 'Email ou mot de passe incorrect' 
      });
    }

    // Générer le token JWT
    const token = signToken(user);

    // Retourner la réponse
    res.json({ 
      token, 
      user: { 
        _id: user._id, 
        nom: user.nom, 
        prenom: user.prenom, 
        email: user.email, 
        role: user.role,
        photo: user.photo
      } 
    });

  } catch (error) {
    console.error('Erreur lors de la connexion:', error);
    next(error);
  }
};

export const me = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-motDePasse');
    if (!user) {
      return res.status(404).json({ 
        message: 'Utilisateur non trouvé' 
      });
    }
    res.json(user);
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    next(error);
  }
};
