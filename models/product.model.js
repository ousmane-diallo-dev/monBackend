import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
  nom: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  prix: { type: Number, required: true },
  quantiteStock: { type: Number, default: 0 },
  images: [{ type: String }],
  categorie: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  dateAjout: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('Product', productSchema);
