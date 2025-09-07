import express from 'express';
const router = express.Router();
import {
  sendMessage,
  replyToMessage,
  getAllConversations,
  getConversationHistory,
  markConversationAsRead,
  getChatStats,
  getClientConversationHistory
} from '../controllers/chat.controller.js';
import authenticate from '../middlewares/auth.middleware.js';
import { isAdmin } from '../middlewares/role.middleware.js';

// Route publique pour envoyer un message (optionnel auth)
const optionalAuth = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (token) {
    return authenticate(req, res, next);
  }
  req.user = null;
  next();
};

router.post('/send', optionalAuth, sendMessage);

// Route publique pour que le client récupère l'historique de sa conversation
router.get('/history/:conversationId', optionalAuth, getClientConversationHistory);

// Routes admin uniquement
router.use(authenticate, isAdmin);

// Répondre à un message
router.post('/reply', replyToMessage);

// Obtenir toutes les conversations
router.get('/conversations', getAllConversations);

// Obtenir l'historique d'une conversation
router.get('/conversation/:conversationId', getConversationHistory);

// Marquer une conversation comme lue
router.patch('/conversation/:conversationId/read', markConversationAsRead);

// Obtenir les statistiques
router.get('/stats', getChatStats);

export default router;
