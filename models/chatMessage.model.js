import mongoose from 'mongoose';

const chatMessageSchema = new mongoose.Schema({
  // Informations de l'utilisateur
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null // null pour les utilisateurs non connectés
  },
  userInfo: {
    nom: { type: String, required: true },
    email: { type: String, required: true },
    telephone: { type: String, default: null },
    isAuthenticated: { type: Boolean, default: false }
  },
  
  // Contenu du message
  message: {
    type: String,
    required: true,
    trim: true
  },
  
  // Type de message
  messageType: {
    type: String,
    enum: ['user', 'admin', 'system'],
    default: 'user'
  },
  
  // ID de conversation pour grouper les messages
  conversationId: {
    type: String,
    required: true
  },
  
  // Statut du message
  status: {
    type: String,
    enum: ['sent', 'delivered', 'read'],
    default: 'sent'
  },
  
  // Réponse automatique ou manuelle
  isAutoResponse: {
    type: Boolean,
    default: false
  },
  
  // Admin qui a répondu (si applicable)
  respondedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  
  // Métadonnées
  metadata: {
    userAgent: String,
    ipAddress: String,
    page: String, // Page d'où le message a été envoyé
    sessionId: String
  }
}, {
  timestamps: true
});

// Index pour optimiser les requêtes
chatMessageSchema.index({ conversationId: 1, createdAt: -1 });
chatMessageSchema.index({ 'userInfo.email': 1 });
chatMessageSchema.index({ status: 1 });
chatMessageSchema.index({ messageType: 1 });

// Méthode pour marquer comme lu
chatMessageSchema.methods.markAsRead = function(adminId) {
  this.status = 'read';
  if (adminId) {
    this.respondedBy = adminId;
  }
  return this.save();
};

// Méthode statique pour obtenir les conversations non lues
chatMessageSchema.statics.getUnreadConversations = function() {
  return this.aggregate([
    { $match: { messageType: 'user', status: { $ne: 'read' } } },
    {
      $group: {
        _id: '$conversationId',
        lastMessage: { $last: '$$ROOT' },
        unreadCount: { $sum: 1 },
        userInfo: { $first: '$userInfo' }
      }
    },
    { $sort: { 'lastMessage.createdAt': -1 } }
  ]);
};

// Méthode statique pour obtenir l'historique d'une conversation
chatMessageSchema.statics.getConversationHistory = function(conversationId) {
  return this.find({ conversationId })
    .populate('userId', 'nom email')
    .populate('respondedBy', 'nom email')
    .sort({ createdAt: 1 });
};

export default mongoose.model('ChatMessage', chatMessageSchema);
