import { Router } from 'express';
import * as ctrl from '../controllers/payment.controller.js';
import auth from '../middlewares/auth.middleware.js';
import allow from '../middlewares/role.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createPaymentSchema, statusSchema } from '../validators/payment.validator.js';

const router = Router();

router.use(auth);

router.post('/', validate(createPaymentSchema), ctrl.create);
router.get('/', allow('admin'), ctrl.list);
router.put('/:id/status', allow('admin'), validate(statusSchema), ctrl.updateStatus);

export default router;
