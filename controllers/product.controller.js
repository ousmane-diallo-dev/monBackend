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
    const { page = 1, limit = 1000, sortBy = 'createdAt', order = 'desc', q } = req.query;
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

export const getById = async (req, res, next) => {
  try {
    const produit = await Product.findById(req.params.id).populate('categorie', 'nom');
    if (!produit) return res.status(404).json({ message: "Produit non trouvé" });
    res.json(produit);
  } catch (e) { next(e); }
};

export const getSimilar = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { limit = 4 } = req.query;
    
    // Récupérer le produit actuel pour obtenir sa catégorie
    const currentProduct = await Product.findById(id).populate('categorie');
    if (!currentProduct) {
      return res.status(404).json({ message: "Produit non trouvé" });
    }
    
    // Rechercher des produits similaires dans la même catégorie
    const similarProducts = await Product.find({
      _id: { $ne: id }, // Exclure le produit actuel
      categorie: currentProduct.categorie?._id || currentProduct.categorie
    })
    .populate('categorie', 'nom')
    .limit(parseInt(limit))
    .sort({ createdAt: -1 }); // Les plus récents en premier
    
    // Si pas assez de produits dans la même catégorie, compléter avec d'autres produits
    if (similarProducts.length < parseInt(limit)) {
      const additionalProducts = await Product.find({
        _id: { $ne: id, $nin: similarProducts.map(p => p._id) }
      })
      .populate('categorie', 'nom')
      .limit(parseInt(limit) - similarProducts.length)
      .sort({ createdAt: -1 });
      
      similarProducts.push(...additionalProducts);
    }
    
    res.json({ data: similarProducts });
  } catch (e) { 
    next(e); 
  }
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
