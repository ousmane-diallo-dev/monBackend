import Joi from 'joi';

export default Joi.object({
  nom: Joi.string().min(2).max(120).required(),
  description: Joi.string().allow('').max(500),
});
