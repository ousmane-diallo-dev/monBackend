import mongoose from 'mongoose';

export default async function connectDB() {
  try {
    // Utiliser une URL MongoDB locale ou une URL de test
    const mongoURI = process.env.MONGO_URI || 'mongodb://localhost:27017/electroshop';
    
    await mongoose.connect(mongoURI);
    console.log('✅ MongoDB connecté sur:', mongoURI);
  } catch (err) {
    console.error('❌ Erreur MongoDB:', err.message);
    console.log('⚠️  Vérifiez que MongoDB est démarré ou utilisez une URL valide');
    // Ne pas arrêter le processus pour permettre les tests
    // process.exit(1);
  }
}
