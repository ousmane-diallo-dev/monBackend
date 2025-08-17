// validators/user.validator.js
import Joi from 'joi';

export const updateProfileSchema = Joi.object({
  nom: Joi.string().min(2).max(100).optional(),
  prenom: Joi.string().min(2).max(100).optional(),
  email: Joi.string().email().optional(),
  motDePasse: Joi.string().min(6).optional(),
  role: Joi.string().valid('admin', 'client').optional()
  
});
