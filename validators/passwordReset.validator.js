import Joi from 'joi';

// Schéma pour demander une réinitialisation
export const requestPasswordResetSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .max(255)
    .messages({
      'string.empty': 'L\'email est requis',
      'string.email': 'Format d\'email invalide',
      'string.max': 'L\'email ne peut pas dépasser 255 caractères'
    })
});

// Schéma pour réinitialiser le mot de passe
export const resetPasswordSchema = Joi.object({
  token: Joi.string()
    .required()
    .min(32)
    .max(255)
    .messages({
      'string.empty': 'Le token est requis',
      'string.min': 'Le token est invalide',
      'string.max': 'Le token est invalide'
    }),
  newPassword: Joi.string()
    .min(8)
    .max(128)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.empty': 'Le nouveau mot de passe est requis',
      'string.min': 'Le mot de passe doit contenir au moins 8 caractères',
      'string.max': 'Le mot de passe ne peut pas dépasser 128 caractères',
      'string.pattern.base': 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'
    }),
  confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .required()
    .messages({
      'string.empty': 'La confirmation du mot de passe est requise',
      'any.only': 'Les mots de passe ne correspondent pas'
    })
});

// Schéma pour vérifier un token
export const verifyTokenSchema = Joi.object({
  token: Joi.string()
    .required()
    .min(32)
    .max(255)
    .messages({
      'string.empty': 'Le token est requis',
      'string.min': 'Le token est invalide',
      'string.max': 'Le token est invalide'
    })
});
