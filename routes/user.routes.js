import { Router } from 'express';
import * as userCtrl from '../controllers/user.controller.js';
import auth from '../middlewares/auth.middleware.js';
import allow from '../middlewares/role.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { updateProfileSchema } from '../validators/user.validator.js';

const router = Router();

router.use(auth);

router.get('/', allow('admin'), userCtrl.listUsers);
router.put('/me', validate(updateProfileSchema), userCtrl.updateMe);

export default router;
