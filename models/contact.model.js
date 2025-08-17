import mongoose from 'mongoose';

const contactSchema = new mongoose.Schema({
  nom: { type: String, required: true },
  email: { type: String, required: true },
  sujet: { type: String, required: true },
  message: { type: String, required: true },
  dateEnvoi: { type: Date, default: Date.now },
}, { timestamps: true });

export default mongoose.model('Contact', contactSchema);
