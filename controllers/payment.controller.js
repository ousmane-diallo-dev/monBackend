import Payment from '../models/payment.model.js';
import Order from '../models/order.model.js';

export const create = async (req, res, next) => {
  try {
    const { commande, montant, methode } = req.body;

    const order = await Order.findById(commande);
    if (!order) return res.status(404).json({ message: 'Commande non trouvée' });

    // Vérif droit : admin ou propriétaire
    if (req.user.role !== 'admin' && order.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const payment = new Payment({
      commande,
      montant,
      methode,
      statut: 'en attente'
    });

    await payment.save();
    res.status(201).json(payment);
  } catch (e) {
    next(e);
  }
};

export const list = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc' } = req.query;
    const sortOrder = order === 'desc' ? -1 : 1;

    let filter = {};
    if (req.user.role !== 'admin') {
      const orders = await Order.find({ client: req.user._id }).select('_id');
      filter = { commande: { $in: orders.map(o => o._id) } };
    }

    const total = await Payment.countDocuments(filter);

    const payments = await Payment.find(filter)
      .populate({ path: 'commande', populate: { path: 'client', select: 'nom prenom email' } })
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: payments
    });
  } catch (e) {
    next(e);
  }
};

export const updateStatus = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const allowedStatus = ['en attente', 'validé', 'échoué'];
    if (!allowedStatus.includes(req.body.statut)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      { statut: req.body.statut },
      { new: true, runValidators: true }
    );

    if (!payment) return res.status(404).json({ message: 'Paiement non trouvé' });

    res.json(payment);
  } catch (e) {
    next(e);
  }
};
export const getPaymentById = async (req, res, next) => {
  try {
    const payment = await Payment.findById(req.params.id)
      .populate({ path: 'commande', populate: { path: 'client', select: 'nom prenom email' } });

    if (!payment) return res.status(404).json({ message: 'Paiement non trouvé' });

    // Vérif droit : admin ou propriétaire
    if (req.user.role !== 'admin' && payment.commande.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    res.json(payment);
  } catch (e) {
    next(e);
  }
};
export const deletePayment = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    const payment = await Payment.findByIdAndDelete(req.params.id);
    if (!payment) return res.status(404).json({ message: 'Paiement non trouvé' });

    res.json({ message: 'Paiement supprimé avec succès' });
  } catch (e) {
    next(e);
  }
}
export const getPaymentByOrderId = async (req, res, next) => {
  try {
    const payment = await Payment.findOne({ commande: req.params.orderId })
      .populate({ path: 'commande', populate: { path: 'client', select: 'nom prenom email' } });

    if (!payment) return res.status(404).json({ message: 'Paiement non trouvé pour cette commande' });

    // Vérif droit : admin ou propriétaire
    if (req.user.role !== 'admin' && payment.commande.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    res.json(payment);
  } catch (e) {
    next(e);
  }
}
export const getPaymentsByClientId = async (req, res, next) => {
  try {
    const payments = await Payment.find({ 'commande.client': req.params.clientId })
      .populate({ path: 'commande', populate: { path: 'client', select: 'nom prenom email' } });

    if (payments.length === 0) return res.status(404).json({ message: 'Aucun paiement trouvé pour ce client' });

    // Vérif droit : admin ou propriétaire
    if (req.user.role !== 'admin' && payments[0].commande.client.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Accès refusé' });
    }

    res.json(payments);
  } catch (e) {
    next(e);
  }
}
export const getPaymentsByStatus = async (req, res, next) => {
  try {
    const { statut } = req.params;

    if (!['en attente', 'validé', 'échoué'].includes(statut)) {
      return res.status(400).json({ message: 'Statut invalide' });
    }

    const payments = await Payment.find({ statut })
      .populate({ path: 'commande', populate: { path: 'client', select: 'nom prenom email' } });

    if (payments.length === 0) return res.status(404).json({ message: 'Aucun paiement trouvé pour ce statut' });

    // Vérif droit : admin ou propriétaire
    if (req.user.role !== 'admin') {
      const orders = await Order.find({ client: req.user._id }).select('_id');
      const orderIds = orders.map(o => o._id);
      payments = payments.filter(p => orderIds.includes(p.commande._id));
    }

    res.json(payments);
  } catch (e) {
    next(e);
  }
}