import Order from '../models/order.model.js';
import Product from '../models/product.model.js';
import mongoose from 'mongoose';
import { sendOrderConfirmationEmail, sendOrderValidatedEmail } from '../config/email.js';

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

export const updateOrder = async (req, res, next) => {
  const { id } = req.params;
  const { adresseLivraison, statut, produits: updatedProduits } = req.body;

  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ message: 'ID de commande invalide' });
  }

  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const originalOrder = await Order.findById(id).session(session);
    if (!originalOrder) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Commande non trouvée' });
    }

    // --- Gestion du stock ---
    const originalProduitsMap = new Map(originalOrder.produits.map(p => [p.produit.toString(), p.quantite]));
    const updatedProduitsMap = new Map(updatedProduits.map((p: any) => [p.produit.toString(), p.quantite]));
    const stockChanges = new Map<string, number>();

    // Rétablir le stock pour les produits retirés ou dont la quantité a diminué
    originalProduitsMap.forEach((originalQuantite, produitId) => {
      const updatedQuantite = updatedProduitsMap.get(produitId) || 0;
      const diff = originalQuantite - updatedQuantite;
      if (diff > 0) {
        stockChanges.set(produitId, (stockChanges.get(produitId) || 0) + diff);
      }
    });

    // Diminuer le stock pour les produits ajoutés ou dont la quantité a augmenté
    updatedProduitsMap.forEach((updatedQuantite, produitId) => {
      const originalQuantite = originalProduitsMap.get(produitId) || 0;
      const diff = updatedQuantite - originalQuantite;
      if (diff > 0) {
        stockChanges.set(produitId, (stockChanges.get(produitId) || 0) - diff);
      }
    });

    for (const [produitId, change] of stockChanges.entries()) {
      await Product.findByIdAndUpdate(produitId, { $inc: { quantiteStock: change } }, { session, new: true });
    }

    // --- Recalcul du total et mise à jour des lignes de produits ---
    let newMontantTotal = 0;
    for (const item of updatedProduits) {
      const produitDoc = await Product.findById(item.produit).session(session);
      if (!produitDoc) throw new Error(`Produit introuvable: ${item.produit}`);
      newMontantTotal += produitDoc.prix * item.quantite;
      item.prixUnitaire = produitDoc.prix;
    }

    // --- Mise à jour de la commande ---
    const updatedOrder = await Order.findByIdAndUpdate(id, {
      adresseLivraison, statut, produits: updatedProduits, montantTotal: newMontantTotal, updatedAt: new Date()
    }, { new: true, session }).populate('client', 'nom prenom email').populate('produits.produit', 'nom prix images');

    await session.commitTransaction();
    res.json(updatedOrder);
  } catch (error: any) {
    await session.abortTransaction();
    res.status(400).json({ message: error.message });
  } finally {
    session.endSession();
  }
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

    // Envoyer l'email de validation au client
    try {
      const clientName = `${populated.client.prenom || ''} ${populated.client.nom}`.trim();
      await sendOrderValidatedEmail(populated, populated.client.email, clientName);
      console.log(`Email de validation de commande envoyé à ${populated.client.email}`);
    } catch (emailError) {
      console.error('Erreur envoi email validation commande:', emailError);
      // Ne pas faire échouer la requête si l'email échoue
    }

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
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé. Seuls les administrateurs peuvent voir les factures.' });
    }
    
    // Vérifier que la commande est livrée pour accéder à la facture
    if (order.statut !== 'livrée') {
      return res.status(403).json({ 
        message: 'La facture n\'est disponible que pour les commandes avec le statut "livrée".'
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