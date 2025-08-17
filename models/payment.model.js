import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema({
  commande: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
  montant: { type: Number, required: true },
  statut: { type: String, enum: ['en attente', 'validé', 'échoué'], default: 'en attente' },
  methode: { type: String, required: true },
  datePaiement: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('Payment', paymentSchema);
