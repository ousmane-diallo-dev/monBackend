import { Router } from 'express';
import * as ctrl from '../controllers/order.controller.js';
import auth from '../middlewares/auth.middleware.js';
import allow from '../middlewares/role.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createOrderSchema, statusSchema } from '../validators/order.validator.js';

const router = Router();

router.use(auth);

router.post('/', validate(createOrderSchema), ctrl.create);
router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);
router.put('/:id/status', allow('admin'), validate(statusSchema), ctrl.updateStatus);
router.post('/:id/cancel', ctrl.cancelMyOrder);

export default router;
