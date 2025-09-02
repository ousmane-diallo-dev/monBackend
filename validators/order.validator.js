import Joi from 'joi';

export const createOrderSchema = Joi.object({
  produits: Joi.array().items(Joi.object({
    produit: Joi.string().required(),
    quantite: Joi.number().integer().min(1).required()
  })).min(1).required(),
  adresseLivraison: Joi.string().min(5).required(),
  modePaiement: Joi.string().required(),
  commentaire: Joi.string().allow('').max(500)
});

export const statusSchema = Joi.object({
  statut: Joi.string().valid('en attente', 'validée', 'rejetée', 'en cours', 'expédiée', 'livrée', 'annulée').required(),
});

export const rejectOrderSchema = Joi.object({
  raison: Joi.string().min(5).max(500).required()
});
