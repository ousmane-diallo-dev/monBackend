import express from 'express';
import validate from '../middlewares/validate.middleware.js';
import { 
  requestPasswordResetSchema, 
  resetPasswordSchema
} from '../validators/passwordReset.validator.js';
import {
  requestPasswordReset,
  verifyResetToken,
  resetPassword,
  cancelPasswordReset
} from '../controllers/passwordReset.controller.js';

const router = express.Router();

// Demander une réinitialisation de mot de passe
router.post('/request', 
  validate(requestPasswordResetSchema), 
  requestPasswordReset
);

// Vérifier la validité d'un token (validation dans le contrôleur car token en params)
router.get('/verify/:token', verifyResetToken);

// Réinitialiser le mot de passe
router.post('/reset', 
  validate(resetPasswordSchema), 
  resetPassword
);

// Annuler une demande de réinitialisation
router.post('/cancel', 
  validate(requestPasswordResetSchema), 
  cancelPasswordReset
);

export default router;
