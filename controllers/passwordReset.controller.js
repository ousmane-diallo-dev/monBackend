import crypto from 'crypto';
import User from '../models/user.model.js';
import PasswordReset from '../models/passwordReset.model.js';
import { sendPasswordResetEmail, sendPasswordChangedEmail } from '../config/email.js';

// Demander une réinitialisation de mot de passe
export const requestPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Vérifier si l'utilisateur existe
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Adresse email introuvable'
      });
    }

    // Supprimer les anciennes demandes de réinitialisation pour cet email
    await PasswordReset.deleteMany({ email: email.toLowerCase() });

    // Générer un token unique
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

    // Créer une nouvelle demande de réinitialisation
    const passwordReset = new PasswordReset({
      email: email.toLowerCase(),
      token: resetTokenHash,
      expiresAt: new Date(Date.now() + 3600000) // 1 heure
    });

    await passwordReset.save();

    // Construire l'URL de réinitialisation
    const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/reset-password?token=${resetToken}`;

    // Envoyer l'email
    try {
      await sendPasswordResetEmail(email, resetToken, resetUrl);
      
      res.status(200).json({
        success: true,
        message: 'Email de réinitialisation envoyé'
      });
    } catch (emailError) {
      // Supprimer la demande si l'email échoue
      await PasswordReset.deleteOne({ email: email.toLowerCase() });
      
      console.error('Erreur lors de l\'envoi de l\'email:', emailError);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'envoi de l\'email de réinitialisation. Veuillez réessayer.'
      });
    }

  } catch (error) {
    console.error('Erreur lors de la demande de réinitialisation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur. Veuillez réessayer.'
    });
  }
};

// Vérifier la validité d'un token
export const verifyResetToken = async (req, res) => {
  try {
    const { token } = req.params;

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token de réinitialisation requis'
      });
    }

    // Hasher le token pour la comparaison
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Rechercher la demande de réinitialisation
    const passwordReset = await PasswordReset.findOne({
      token: tokenHash,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!passwordReset) {
      return res.status(400).json({
        success: false,
        message: 'Token de réinitialisation invalide ou expiré'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Token valide',
      email: passwordReset.email
    });

  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};

// Réinitialiser le mot de passe
export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword, confirmPassword } = req.body;

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'Les mots de passe ne correspondent pas'
      });
    }

    // Hasher le token pour la comparaison
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Rechercher la demande de réinitialisation
    const passwordReset = await PasswordReset.findOne({
      token: tokenHash,
      used: false,
      expiresAt: { $gt: new Date() }
    });

    if (!passwordReset) {
      return res.status(400).json({
        success: false,
        message: 'Token de réinitialisation invalide ou expiré'
      });
    }

    // Rechercher l'utilisateur
    const user = await User.findOne({ email: passwordReset.email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      });
    }

    // Mettre à jour le mot de passe de l'utilisateur (le hook pre('save') le hashera)
    user.motDePasse = newPassword;
    await user.save();

    // Marquer le token comme utilisé
    passwordReset.used = true;
    await passwordReset.save();

    // Envoyer un email de confirmation
    try {
      await sendPasswordChangedEmail(user.email);
    } catch (emailError) {
      console.error('Erreur lors de l\'envoi de l\'email de confirmation:', emailError);
      // Ne pas faire échouer la réinitialisation si l'email de confirmation échoue
    }

    res.status(200).json({
      success: true,
      message: 'Mot de passe réinitialisé avec succès'
    });

  } catch (error) {
    console.error('Erreur lors de la réinitialisation du mot de passe:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur. Veuillez réessayer.'
    });
  }
};

// Annuler une demande de réinitialisation
export const cancelPasswordReset = async (req, res) => {
  try {
    const { email } = req.body;

    // Supprimer toutes les demandes de réinitialisation pour cet email
    const result = await PasswordReset.deleteMany({ email: email.toLowerCase() });

    res.status(200).json({
      success: true,
      message: 'Demande de réinitialisation annulée'
    });

  } catch (error) {
    console.error('Erreur lors de l\'annulation de la réinitialisation:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
};
