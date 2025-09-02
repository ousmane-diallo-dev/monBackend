import mongoose from 'mongoose';

export default async function connectDB() {
  try {
    const mongoURI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/electroshop';
    
    console.log('🔍 Tentative de connexion à:', mongoURI.replace(/\/\/[^:]+:[^@]+@/, '//***:***@'));
    
    await mongoose.connect(mongoURI, {
      serverSelectionTimeoutMS: 10000,
      socketTimeoutMS: 45000,
    });
    console.log('✅ MongoDB connecté avec succès !');
  } catch (err) {
    console.error('❌ Erreur MongoDB:', err.message);
    console.log('⚠️  Vérifications nécessaires:');
    console.log('   - IP autorisée dans MongoDB Atlas');
    console.log('   - Credentials corrects dans .env');
    console.log('   - Connexion internet stable');
    // Ne pas arrêter le processus pour permettre les tests
    // process.exit(1);
  }
}
