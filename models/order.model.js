import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  produits: [{
    produit: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
    quantite: { type: Number, required: true, min: 1 },
    prixUnitaire: { type: Number, required: true },
  }],
  statut: { type: String, enum: ['en attente', 'en cours', 'expédiée', 'livrée', 'annulée'], default: 'en attente' },
  montantTotal: { type: Number, required: true },
  adresseLivraison: { type: String, required: true },
  modePaiement: { type: String, required: true },
  dateCommande: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('Order', orderSchema);
