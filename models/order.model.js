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


// Middleware pour calculer le total automatiquement avant enregistrement
orderSchema.pre('save', async function(next) {
  if (this.produits && this.produits.length > 0) {
    let total = 0;
    for (const item of this.produits) {
      // Récupère le prix du produit depuis la DB
      const Produit = mongoose.model('Product');
      const produitDoc = await Produit.findById(item.produit);
      if (produitDoc) total += produitDoc.prix * item.quantite;
    }
    this.montantTotal = total;
  }
  next();
});



export default mongoose.model('Order', orderSchema);
