import Joi from 'joi';

export default Joi.object({
  nom: Joi.string().min(2).max(120).required(),
  email: Joi.string().email().required(),
  sujet: Joi.string().min(3).max(200).required(),
  message: Joi.string().min(5).max(2000).required(),
});
