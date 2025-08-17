import Category from '../models/category.model.js';

export const create = async (req, res, next) => {
  try {
    const exists = await Category.findOne({ nom: req.body.nom });
    if (exists) return res.status(400).json({ message: 'Cette catégorie existe déjà' });
    const cat = new Category(req.body);
    await cat.save();
    res.status(201).json(cat);
  } catch (e) { next(e); }
};

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
    res.json({ total, page: parseInt(page), pages: Math.ceil(total / limit), data: cats });
  } catch (e) { next(e); }
};

export const getOne = async (req, res, next) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) return res.status(404).json({ message: 'Catégorie non trouvée' });
    res.json(cat);
  } catch (e) { next(e); }
};

export const update = async (req, res, next) => {
  try {
    const cat = await Category.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!cat) return res.status(404).json({ message: 'Catégorie non trouvée' });
    res.json(cat);
  } catch (e) { next(e); }
};

export const remove = async (req, res, next) => {
  try {
    const cat = await Category.findByIdAndDelete(req.params.id);
    if (!cat) return res.status(404).json({ message: 'Catégorie non trouvée' });
    res.json({ message: 'Catégorie supprimée', cat });
  } catch (e) { next(e); }
};
