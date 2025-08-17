import Joi from 'joi';

export const createOrderSchema = Joi.object({
  produits: Joi.array().items(Joi.object({
    produit: Joi.string().required(),
    quantite: Joi.number().integer().min(1).required(),
    prixUnitaire: Joi.number().positive().required(),
  })).min(1).required(),
  montantTotal: Joi.number().positive().required(),
  adresseLivraison: Joi.string().min(5).required(),
  modePaiement: Joi.string().required(),
});

export const statusSchema = Joi.object({
  statut: Joi.string().valid('en attente', 'en cours', 'expédiée', 'livrée', 'annulée').required(),
});
