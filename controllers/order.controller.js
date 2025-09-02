import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import mongoose from 'mongoose';
import { sendOrderConfirmationEmail } from '../config/email.js';

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

      // Envoyer l'email de confirmation au client
      try {
        const clientName = `${populated.client.prenom} ${populated.client.nom}`;
        await sendOrderConfirmationEmail(populated, populated.client.email, clientName);
        console.log(`Email de confirmation envoyé à ${populated.client.email}`);
      } catch (emailError) {
        console.error('Erreur envoi email confirmation:', emailError);
        // Ne pas faire échouer la commande si l'email échoue
      }

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
      .populate('produits.produit', 'nom prix')
      .populate('adminValidateur', 'nom prenom');
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

// Valider une commande par l'admin
export const validateOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Commande non trouvée' });
    
    if (order.statut !== 'en attente') {
      return res.status(400).json({ message: 'Cette commande ne peut plus être validée' });
    }

    order.statut = 'validée';
    order.validéeParAdmin = true;
    order.dateValidation = new Date();
    order.adminValidateur = req.user.id;
    await order.save();

    const populated = await Order.findById(order._id)
      .populate('client', 'nom prenom email')
      .populate('produits.produit', 'nom prix')
      .populate('adminValidateur', 'nom prenom');

    res.json(populated);
  } catch (e) { next(e); }
};

// Rejeter une commande par l'admin
export const rejectOrder = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ message: 'Commande non trouvée' });
    
    if (order.statut !== 'en attente') {
      return res.status(400).json({ message: 'Cette commande ne peut plus être rejetée' });
    }

    // Rétablir le stock
    for (const l of order.produits) {
      await Product.findByIdAndUpdate(l.produit, { $inc: { quantiteStock: l.quantite } });
    }

    order.statut = 'rejetée';
    order.dateValidation = new Date();
    order.adminValidateur = req.user.id;
    order.raisonRejet = req.body.raison || 'Aucune raison spécifiée';
    await order.save();

    const populated = await Order.findById(order._id)
      .populate('client', 'nom prenom email')
      .populate('produits.produit', 'nom prix')
      .populate('adminValidateur', 'nom prenom');

    res.json(populated);
  } catch (e) { next(e); }
};

// Obtenir les commandes en attente pour l'admin
export const getPendingOrders = async (req, res, next) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const filter = { statut: 'en attente' };
    
    const total = await Order.countDocuments(filter);
    const orders = await Order.find(filter)
      .populate('client', 'nom prenom email telephone')
      .populate('produits.produit', 'nom prix')
      .sort({ dateCommande: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    
    res.json({ 
      total, 
      page: parseInt(page), 
      pages: Math.ceil(total / limit), 
      data: orders 
    });
  } catch (e) { next(e); }
};

// Obtenir le nombre de nouvelles commandes pour notifications
export const getNewOrdersCount = async (req, res, next) => {
  try {
    const count = await Order.countDocuments({ statut: 'en attente' });
    res.json({ count });
  } catch (e) { next(e); }
};

// Obtenir la facture (seulement si commande validée)
export const getInvoice = async (req, res, next) => {
  try {
    const order = await Order.findById(req.params.id)
      .populate('client', 'nom prenom email telephone adresse')
      .populate('produits.produit', 'nom prix description')
      .populate('adminValidateur', 'nom prenom');
    
    if (!order) return res.status(404).json({ message: 'Commande non trouvée' });
    
    // Vérifier que l'utilisateur a le droit d'accéder à cette commande
    if (req.user.role !== 'admin' && order.client._id.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Accès refusé' });
    }
    
    // Vérifier que la commande est validée pour accéder à la facture
    if (!order.validéeParAdmin || order.statut === 'rejetée') {
      return res.status(403).json({ 
        message: 'La facture n\'est pas disponible. La commande doit être validée par un administrateur.' 
      });
    }
    
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