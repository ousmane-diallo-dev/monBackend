import Joi from 'joi';

export const registerSchema = Joi.object({
  nom: Joi.string().min(2).max(100).required(),
  prenom: Joi.string().min(2).max(100).required(),
  email: Joi.string().email().required(),
  motDePasse: Joi.string().min(6).required(),
  role: Joi.string().valid('admin', 'client').optional()
});

export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  motDePasse: Joi.string().required(),
});
