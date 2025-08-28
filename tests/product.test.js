import request from 'supertest';
import app from '../server'; // Assurez-vous que le chemin vers votre serveur est correct
import { connectDB, disconnectDB } from '../config/database'; // Assurez-vous que ces fonctions existent

describe('Product API', () => {
  beforeAll(async () => {
    await connectDB();
  });

  afterAll(async () => {
    await disconnectDB();
  });

  it('should add a product successfully with valid data', async () => {
    const token = 'VALID_ADMIN_TOKEN'; // Remplacez par un token valide
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .field('nom', 'Test Product')
      .field('prix', '100')
      .field('description', 'Test Description')
      .field('categorie', 'CATEGORY_ID') // Remplacez par un ID de catégorie valide
      .field('quantiteStock', '10')
      .attach('images', 'path/to/image.jpg'); // Remplacez par un chemin d'image valide

    expect(response.status).toBe(201);
    expect(response.body).toHaveProperty('message', 'Produit ajouté avec succès');
  });

  it('should return an error when required fields are missing', async () => {
    const token = 'VALID_ADMIN_TOKEN'; // Remplacez par un token valide
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({}); // Pas de données

    expect(response.status).toBe(400);
    expect(response.body).toHaveProperty('message', 'Le nom est requis');
  });

  it('should return an error for non-admin users', async () => {
    const token = 'VALID_USER_TOKEN'; // Remplacez par un token d'utilisateur non-admin
    const response = await request(app)
      .post('/api/products')
      .set('Authorization', `Bearer ${token}`)
      .send({
        nom: 'Test Product',
        prix: '100',
        description: 'Test Description',
        categorie: 'CATEGORY_ID', // Remplacez par un ID de catégorie valide
        quantiteStock: '10'
      });

    expect(response.status).toBe(403);
    expect(response.body).toHaveProperty('message', 'Accès refusé.');
  });

  // Ajoutez d'autres tests selon les besoins
});
