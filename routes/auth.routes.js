import { Router } from 'express';
import * as authCtrl from '../controllers/auth.controller.js';
import validate from '../middlewares/validate.middleware.js';
import { registerSchema, loginSchema } from '../validators/auth.validator.js';
import auth from '../middlewares/auth.middleware.js';

const router = Router();

router.post('/register', validate(registerSchema), authCtrl.register);
router.post('/login', validate(loginSchema), authCtrl.login);
router.get('/me', auth, authCtrl.me);

export default router;
