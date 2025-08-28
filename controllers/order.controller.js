import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import mongoose from 'mongoose';

export const create = async (req, res, next) => {
  try {
    // Construire les lignes de commande avec prix unitaire issu de la base
    const lignes = [];
    let total = 0;

    for (const item of req.body.produits || []) {
      const produitDoc = await Product.findById(item.produit);
      if (!produitDoc) return res.status(400).json({ message: `Produit introuvable: ${item.produit}` });
      if (produitDoc.quantiteStock < item.quantite) {
        return res.status(400).json({ message: `Stock insuffisant pour ${produitDoc.nom}` });
      }
      const prixUnitaire = produitDoc.prix;
      lignes.push({ produit: produitDoc._id, quantite: item.quantite, prixUnitaire });
      total += prixUnitaire * item.quantite;
    }

    // Décrémenter le stock
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      for (const l of lignes) {
        const updated = await Product.findOneAndUpdate(
          { _id: l.produit, quantiteStock: { $gte: l.quantite } },
          { $inc: { quantiteStock: -l.quantite } },
          { new: true, session }
        );
        if (!updated) throw new Error('Stock insuffisant pendant la réservation');
      }

      const order = new Order({
        client: req.user.id,
        produits: lignes,
        montantTotal: total,
        adresseLivraison: req.body.adresseLivraison,
        modePaiement: req.body.modePaiement,
      });
      await order.save({ session });

      await session.commitTransaction();
      session.endSession();

      const populated = await Order.findById(order._id)
        .populate('client', 'nom prenom email')
        .populate('produits.produit', 'nom prix');

      res.status(201).json(populated);
    } catch (err) {
      await session.abortTransaction();
      session.endSession();
      throw err;
    }
  } catch (e) { next(e); }
};

export const list = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;
    const sortOrder = order === 'desc' ? -1 : 1;
    const filter = req.user.role === 'admin' ? {} : { client: req.user.id };
    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('client', 'nom prenom email')
      .populate('produits.produit', 'nom prix')
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ total, page: parseInt(page), pages: Math.ceil(total / limit), data: orders });
  } catch (e) { next(e); }
};

export const getOne = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('client', 'nom prenom email')
      .populate('produits.produit', 'nom prix');
    if (!order) return res.status(404).json({ message: 'Commande non trouvée' });
    if (req.user.role !== 'admin' && order.client._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    res.json(order);
  } catch (e) { next(e); }
};

export const updateStatus = async (req, res, next) => {
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { statut: req.body.statut }, { new: true })
      .populate('client', 'nom prenom email')
      .populate('produits.produit', 'nom prix');
    if (!order) return res.status(404).json({ message: 'Commande non trouvée' });
    res.json(order);
  } catch (e) { next(e); }
};

// Annulation par le client si statut en attente
export const cancelMyOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Commande non trouvée' });
    if (order.client.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    if (order.statut !== 'en attente') {
      return res.status(400).json({ message: 'Impossible d’annuler cette commande' });
    }

    // Rétablir le stock
    for (const l of order.produits) {
      await Product.findByIdAndUpdate(l.produit, { $inc: { quantiteStock: l.quantite } });
    }

    order.statut = 'annulée';
    await order.save();

    const populated = await Order.findById(order._id)
      .populate('client', 'nom prenom email')
      .populate('produits.produit', 'nom prix');

    res.json(populated);
  } catch (e) { next(e); }
};