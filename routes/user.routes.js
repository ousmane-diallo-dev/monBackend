import { Router } from 'express';
import { uploadPhoto, promoteToAdmin, demoteToClient } from "../controllers/user.controller.js";
import * as userCtrl from '../controllers/user.controller.js';
import auth from '../middlewares/auth.middleware.js';
import allow from '../middlewares/role.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { updateProfileSchema } from '../validators/user.validator.js';
import upload from "../middlewares/upload.middleware.js";


const router = Router();

router.use(auth);
router.put("/photo", upload.single("photo"), uploadPhoto);

router.get('/me', userCtrl.getMe);

router.get('/', allow('admin'), userCtrl.listUsers);
router.put('/me', validate(updateProfileSchema), userCtrl.updateMe);

// Route pour promouvoir un utilisateur en admin (admin uniquement)
router.put('/:id/promote', allow('admin'), promoteToAdmin);
// Route pour rétrograder un utilisateur en client (admin uniquement)
router.put('/:id/demote', allow('admin'), demoteToClient);
router.delete('/:id', allow('admin'), userCtrl.deleteUserById);

export default router;
