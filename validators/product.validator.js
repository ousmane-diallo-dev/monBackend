import Joi from 'joi';

export default Joi.object({
  nom: Joi.string().min(3).max(120).required(),
  description: Joi.string().allow('').max(1000),
  prix: Joi.number().positive().required(),
  quantiteStock: Joi.number().integer().min(0).required(),
  images: Joi.array().items(Joi.string().uri()).default([]),
  categorie: Joi.string().required(),
});
