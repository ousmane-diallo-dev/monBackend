import axios from 'axios';

const API_BASE = 'http://localhost:5000/api';

// Test data for bulk category creation
const testCategories = [
  { nom: "Test Smartphones", description: "Téléphones intelligents de test" },
  { nom: "Test Ordinateurs", description: "Ordinateurs de test" },
  { nom: "Test Audio", description: "Équipements audio de test" },
  { nom: "Test Accessoires" } // Sans description
];

async function testBulkCategoryCreation() {
  try {
    console.log('🧪 Test de création en lot de catégories...');
    console.log('Données à envoyer:', JSON.stringify(testCategories, null, 2));

    // Note: Ce test nécessite un token admin valide
    // Pour un test complet, vous devrez d'abord vous connecter en tant qu'admin
    const response = await axios.post(`${API_BASE}/categories/many`, testCategories, {
      headers: {
        'Content-Type': 'application/json',
        // 'Authorization': 'Bearer YOUR_ADMIN_TOKEN_HERE'
      }
    });

    console.log('✅ Succès! Réponse du serveur:');
    console.log(JSON.stringify(response.data, null, 2));
    
  } catch (error) {
    if (error.response) {
      console.log('❌ Erreur du serveur:');
      console.log('Status:', error.response.status);
      console.log('Message:', error.response.data);
    } else if (error.request) {
      console.log('❌ Erreur de réseau:', error.message);
    } else {
      console.log('❌ Erreur:', error.message);
    }
  }
}

// Test de validation des données
function testDataValidation() {
  console.log('\n🔍 Test de validation des données...');
  
  const categories = testCategories.map(c => ({
    nom: c.nom?.trim(),
    description: c.description || ""
  }));

  console.log('Données nettoyées:', JSON.stringify(categories, null, 2));
  
  // Vérification des doublons
  const noms = categories.map(c => c.nom);
  const hasDuplicates = noms.length !== new Set(noms).size;
  console.log('Doublons détectés:', hasDuplicates);
  
  // Validation des champs
  const validCategories = categories.every(cat => 
    cat.nom && 
    cat.nom.length >= 2 && 
    cat.nom.length <= 120 &&
    (!cat.description || cat.description.length <= 500)
  );
  console.log('Toutes les catégories sont valides:', validCategories);
}

// Exécuter les tests
console.log('🚀 Démarrage des tests...\n');
testDataValidation();
testBulkCategoryCreation();
