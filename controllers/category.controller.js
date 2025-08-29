import Category from '../models/category.model.js';

// ➤ Ajouter une seule catégorie
export const create = async (req, res, next) => {
  try {
    const exists = await Category.findOne({ nom: req.body.nom });
    if (exists) return res.status(400).json({ message: 'Cette catégorie existe déjà' });
    
    const cat = new Category(req.body);
    await cat.save();
    
    res.status(201).json(cat);
  } catch (e) {
    next(e);
  }
};

// ➤ Ajouter plusieurs catégories d’un coup
export const createMany = async (req, res, next) => {
  try {
    if (!Array.isArray(req.body) || req.body.length === 0) {
      return res.status(400).json({ message: "Veuillez envoyer un tableau de catégories" });
    }

    // Nettoyer les noms pour éviter les doublons d'espaces
    const categories = req.body.map(c => ({
      nom: c.nom?.trim(),
      description: c.description || ""
    }));

    // Vérifier les doublons déjà existants en base
    const noms = categories.map(c => c.nom);
    const exists = await Category.find({ nom: { $in: noms } });

    if (exists.length > 0) {
      return res.status(400).json({
        message: "Certaines catégories existent déjà",
        doublons: exists.map(e => e.nom)
      });
    }

    // Insertion multiple
    const cats = await Category.insertMany(categories);
    res.status(201).json(cats);
  } catch (e) {
    next(e);
  }
};

// ➤ Liste avec pagination, tri et recherche
export const list = async (req, res, next) => {
  try {
    const { page = 1, limit = 10, sortBy = 'createdAt', order = 'desc', q } = req.query;
    const sortOrder = order === 'desc' ? -1 : 1;
    const filter = q ? { nom: { $regex: q, $options: 'i' } } : {};

    const total = await Category.countDocuments(filter);
    const cats = await Category.find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    res.json({
      total,
      page: parseInt(page),
      pages: Math.ceil(total / limit),
      data: cats
    });
  } catch (e) {
    next(e);
  }
};

// ➤ Récupérer une catégorie
export const getOne = async (req, res, next) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) return res.status(404).json({ message: 'Catégorie non trouvée' });
    res.json(cat);
  } catch (e) {
    next(e);
  }
};

// ➤ Modifier une catégorie
export const update = async (req, res, next) => {
  try {
    const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cat) return res.status(404).json({ message: 'Catégorie non trouvée' });
    res.json(cat);
  } catch (e) {
    next(e);
  }
};

// ➤ Supprimer une catégorie
export const remove = async (req, res, next) => {
  try {
    const cat = await Category.findByIdAndDelete(req.params.id);
    if (!cat) return res.status(404).json({ message: 'Catégorie non trouvée' });
    res.json({ message: 'Catégorie supprimée', cat });
  } catch (e) {
    next(e);
  }
};
