import Product from '../models/product.model.js';

export const create = async (req, res, next) => {
  try {
    let images = req.body.images || [];
    if (req.files && req.files.length > 0) {
      images = req.files.map(f => `/uploads/${f.filename}`);
    }
    const produit = new Product({
      ...req.body,
      images
    });
    await produit.save();
    res.status(201).json(produit);
  } catch (e) { next(e); }
};

export const list = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc', q } = req.query;
    const sortOrder = order === 'desc' ? -1 : 1;
    const filter = q ? { nom: { $regex: q, $options: 'i' } } : {};
    const total = await Product.countDocuments(filter);
    const produits = await Product.find(filter)
      .populate('categorie', 'nom')
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));
    res.json({ total, page: parseInt(page), pages: Math.ceil(total / limit), data: produits });
  } catch (e) { next(e); }
};

export const getOne = async (req, res, next) => {
  try {
    const produit = await Product.findById(req.params.id).populate('categorie', 'nom');
    if (!produit) return res.status(404).json({ message: 'Produit non trouvé' });
    res.json(produit);
  } catch (e) { next(e); }
};

export const update = async (req, res, next) => {
  try {
    const updates = { ...req.body };

    // Si des fichiers images sont envoyés, remplacer le champ images par les nouveaux chemins
    if (req.files && req.files.length > 0) {
      updates.images = req.files.map(f => `/uploads/${f.filename}`);
    } else {
      // Si aucune image n'est fournie dans la requête, ne pas écraser les images existantes
      if (typeof updates.images === 'undefined') {
        delete updates.images;
      }
    }

    const produit = await Product.findByIdAndUpdate(
      req.params.id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    if (!produit) return res.status(404).json({ message: 'Produit non trouvé' });
    res.json(produit);
  } catch (e) { next(e); }
};

export const remove = async (req, res, next) => {
  try {
    const produit = await Product.findByIdAndDelete(req.params.id);
    if (!produit) return res.status(404).json({ message: 'Produit non trouvé' });
    res.json({ message: 'Produit supprimé', produit });
  } catch (e) { next(e); }
};
