import { Router } from 'express';
import * as ctrl from '../controllers/order.controller.js';
import auth from '../middlewares/auth.middleware.js';
import allow from '../middlewares/role.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import { createOrderSchema, statusSchema, rejectOrderSchema } from '../validators/order.validator.js';

const router = Router();

router.use(auth);

router.post('/', validate(createOrderSchema), ctrl.create);
router.get('/', ctrl.list);
router.get('/pending', allow('admin'), ctrl.getPendingOrders);
router.get('/notifications/count', allow('admin'), ctrl.getNewOrdersCount);
router.get('/:id', ctrl.getOne);
router.get('/:id/invoice', ctrl.getInvoice);
router.put('/:id/status', allow('admin'), validate(statusSchema), ctrl.updateStatus);
router.put('/:id/validate', allow('admin'), ctrl.validateOrder);
router.put('/:id/reject', allow('admin'), validate(rejectOrderSchema), ctrl.rejectOrder);
router.post('/:id/cancel', ctrl.cancelMyOrder);

export default router;
