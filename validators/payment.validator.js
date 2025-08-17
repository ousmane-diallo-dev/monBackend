import Joi from 'joi';

export const createPaymentSchema = Joi.object({
  commande: Joi.string().required(),
  montant: Joi.number().positive().required(),
  methode: Joi.string().required(),
  statut: Joi.string().valid('en attente', 'validé', 'échoué').optional()
})
.required();

export const statusSchema = Joi.object({
  statut: Joi.string().valid('en attente', 'validé', 'échoué').required(),
});
