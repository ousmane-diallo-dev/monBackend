import Order from '../models/order.model.js';

export const create = async (req, res, next) => {
  try {
    const data = { ...req.body, client: req.user.id };
    const order = new Order(data);
    await order.save();
    res.status(201).json(order);
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
    const order = await Order.findByIdAndUpdate(req.params.id, { statut: req.body.statut }, { new: true });
    if (!order) return res.status(404).json({ message: 'Commande non trouvée', order });
    res.json(order);
  } catch (e) { next(e); }
};
