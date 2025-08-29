import ChatMessage from '../models/chatMessage.model.js';
import User from '../models/user.model.js';
import crypto from 'crypto';

// Fonction pour générer un UUID simple
const generateUUID = () => {
  return crypto.randomUUID();
};

// Envoyer un message de chat
const sendMessage = async (req, res) => {
  try {
    const { message, userInfo, conversationId, metadata } = req.body;
    
    // Générer un ID de conversation si non fourni
    const finalConversationId = conversationId || generateUUID();
    
    // Vérifier si l'utilisateur est authentifié
    let userId = null;
    let isAuthenticated = false;
    
    if (req.user) {
      userId = req.user._id;
      isAuthenticated = true;
    }
    
    // Créer le message
    const chatMessage = new ChatMessage({
      userId,
      userInfo: {
        nom: userInfo.nom || (req.user ? req.user.nom : 'Utilisateur anonyme'),
        email: userInfo.email || (req.user ? req.user.email : 'anonymous@example.com'),
        telephone: userInfo.telephone || (req.user ? req.user.telephone : null),
        isAuthenticated
      },
      message,
      conversationId: finalConversationId,
      messageType: 'user',
      metadata: {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        page: metadata?.page || 'unknown',
        sessionId: metadata?.sessionId || req.sessionID
      }
    });
    
    await chatMessage.save();
    
    res.status(201).json({
      success: true,
      message: 'Message envoyé avec succès',
      data: {
        messageId: chatMessage._id,
        conversationId: finalConversationId,
        timestamp: chatMessage.createdAt
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de l\'envoi du message:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi du message',
      error: error.message
    });
  }
};

// Répondre à un message (Admin uniquement)
const replyToMessage = async (req, res) => {
  try {
    const { conversationId, message } = req.body;
    const adminId = req.user._id;
    
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Seuls les admins peuvent répondre.'
      });
    }
    
    // Obtenir les infos de la conversation pour récupérer les infos utilisateur
    const lastUserMessage = await ChatMessage.findOne({
      conversationId,
      messageType: 'user'
    }).sort({ createdAt: -1 });
    
    if (!lastUserMessage) {
      return res.status(404).json({
        success: false,
        message: 'Conversation non trouvée'
      });
    }
    
    // Créer la réponse admin
    const adminReply = new ChatMessage({
      userId: adminId,
      userInfo: {
        nom: req.user.nom,
        email: req.user.email,
        telephone: req.user.telephone,
        isAuthenticated: true
      },
      message,
      conversationId,
      messageType: 'admin',
      respondedBy: adminId,
      metadata: {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
        page: 'admin-chat',
        sessionId: req.sessionID
      }
    });
    
    await adminReply.save();
    
    // Marquer les messages utilisateur comme lus
    await ChatMessage.updateMany(
      { conversationId, messageType: 'user', status: { $ne: 'read' } },
      { status: 'read', respondedBy: adminId }
    );
    
    res.status(201).json({
      success: true,
      message: 'Réponse envoyée avec succès',
      data: {
        messageId: adminReply._id,
        conversationId,
        timestamp: adminReply.createdAt
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la réponse:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de l\'envoi de la réponse',
      error: error.message
    });
  }
};

// Obtenir toutes les conversations non lues (Admin uniquement)
const getUnreadConversations = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Seuls les admins peuvent voir les conversations.'
      });
    }
    
    const conversations = await ChatMessage.getUnreadConversations();
    
    res.status(200).json({
      success: true,
      data: conversations,
      count: conversations.length
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des conversations',
      error: error.message
    });
  }
};

// Obtenir toutes les conversations (Admin uniquement)
const getAllConversations = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Seuls les admins peuvent voir les conversations.'
      });
    }
    
    const { page = 1, limit = 20, status } = req.query;
    
    let matchCondition = { messageType: 'user' };
    if (status) {
      matchCondition.status = status;
    }
    
    const conversations = await ChatMessage.aggregate([
      { $match: matchCondition },
      {
        $group: {
          _id: '$conversationId',
          lastMessage: { $last: '$$ROOT' },
          messageCount: { $sum: 1 },
          unreadCount: {
            $sum: { $cond: [{ $ne: ['$status', 'read'] }, 1, 0] }
          },
          userInfo: { $first: '$userInfo' },
          firstMessageDate: { $first: '$createdAt' }
        }
      },
      { $sort: { 'lastMessage.createdAt': -1 } },
      { $skip: (page - 1) * limit },
      { $limit: parseInt(limit) }
    ]);
    
    res.status(200).json({
      success: true,
      data: conversations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total: conversations.length
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des conversations:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des conversations',
      error: error.message
    });
  }
};

// Obtenir l'historique d'une conversation (Admin uniquement)
const getConversationHistory = async (req, res) => {
  try {
    const { conversationId } = req.params;
    
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Seuls les admins peuvent voir l\'historique.'
      });
    }
    
    const messages = await ChatMessage.getConversationHistory(conversationId);
    
    if (messages.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Conversation non trouvée'
      });
    }
    
    res.status(200).json({
      success: true,
      data: messages,
      conversationId,
      messageCount: messages.length
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération de l\'historique:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'historique',
      error: error.message
    });
  }
};

// Marquer une conversation comme lue (Admin uniquement)
const markConversationAsRead = async (req, res) => {
  try {
    const { conversationId } = req.params;
    const adminId = req.user._id;
    
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Seuls les admins peuvent marquer comme lu.'
      });
    }
    
    const result = await ChatMessage.updateMany(
      { conversationId, messageType: 'user', status: { $ne: 'read' } },
      { status: 'read', respondedBy: adminId }
    );
    
    res.status(200).json({
      success: true,
      message: 'Conversation marquée comme lue',
      data: {
        conversationId,
        updatedMessages: result.modifiedCount
      }
    });
    
  } catch (error) {
    console.error('Erreur lors du marquage comme lu:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors du marquage comme lu',
      error: error.message
    });
  }
};

// Obtenir les statistiques des messages (Admin uniquement)
const getChatStats = async (req, res) => {
  try {
    // Vérifier que l'utilisateur est admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé. Seuls les admins peuvent voir les statistiques.'
      });
    }
    
    const stats = await ChatMessage.aggregate([
      {
        $group: {
          _id: null,
          totalMessages: { $sum: 1 },
          totalConversations: { $addToSet: '$conversationId' },
          unreadMessages: {
            $sum: { $cond: [{ $and: [{ $eq: ['$messageType', 'user'] }, { $ne: ['$status', 'read'] }] }, 1, 0] }
          },
          todayMessages: {
            $sum: {
              $cond: [
                { $gte: ['$createdAt', new Date(new Date().setHours(0, 0, 0, 0))] },
                1,
                0
              ]
            }
          }
        }
      },
      {
        $project: {
          _id: 0,
          totalMessages: 1,
          totalConversations: { $size: '$totalConversations' },
          unreadMessages: 1,
          todayMessages: 1
        }
      }
    ]);
    
    res.status(200).json({
      success: true,
      data: stats[0] || {
        totalMessages: 0,
        totalConversations: 0,
        unreadMessages: 0,
        todayMessages: 0
      }
    });
    
  } catch (error) {
    console.error('Erreur lors de la récupération des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques',
      error: error.message
    });
  }
};

export {
  sendMessage,
  replyToMessage,
  getUnreadConversations,
  getAllConversations,
  getConversationHistory,
  markConversationAsRead,
  getChatStats
};
