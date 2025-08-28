import Joi from 'joi';

export const registerSchema = Joi.object({
  nom: Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .required()
    .messages({
      'string.empty': 'Le nom est requis',
      'string.min': 'Le nom doit contenir au moins 2 caractères',
      'string.max': 'Le nom ne peut pas dépasser 100 caractères',
      'string.pattern.base': 'Le nom ne peut contenir que des lettres, espaces, tirets et apostrophes',
      'any.required': 'Le nom est requis'
    }),
  
  prenom: Joi.string()
    .min(2)
    .max(100)
    .pattern(/^[a-zA-ZÀ-ÿ\s'-]+$/)
    .optional()
    .messages({
      'string.min': 'Le prénom doit contenir au moins 2 caractères',
      'string.max': 'Le prénom ne peut pas dépasser 100 caractères',
      'string.pattern.base': 'Le prénom ne peut contenir que des lettres, espaces, tirets et apostrophes'
    }),
  
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .max(255)
    .required()
    .messages({
      'string.empty': 'L\'adresse email est requise',
      'string.email': 'Format d\'adresse email invalide',
      'string.max': 'L\'adresse email ne peut pas dépasser 255 caractères',
      'any.required': 'L\'adresse email est requise'
    }),
  
  motDePasse: Joi.string()
    .min(6)
    .max(128)
    .required()
    .messages({
      'string.empty': 'Le mot de passe est requis',
      'string.min': 'Le mot de passe doit contenir au moins 6 caractères',
      'string.max': 'Le mot de passe ne peut pas dépasser 128 caractères',
      'any.required': 'Le mot de passe est requis'
    }),
  
  role: Joi.string()
    .valid('admin', 'client')
    .default('client')
    .messages({
      'any.only': 'Le rôle doit être soit "admin" soit "client"'
    })
});

export const loginSchema = Joi.object({
  email: Joi.string()
    .email({ tlds: { allow: false } })
    .required()
    .messages({
      'string.empty': 'L\'adresse email est requise',
      'string.email': 'Format d\'adresse email invalide',
      'any.required': 'L\'adresse email est requise'
    }),
  
  motDePasse: Joi.string()
    .required()
    .messages({
      'string.empty': 'Le mot de passe est requis',
      'any.required': 'Le mot de passe est requis'
    })
});
