import { Router } from 'express';
import * as ctrl from '../controllers/product.controller.js';
import auth from '../middlewares/auth.middleware.js';
import allow from '../middlewares/role.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import productSchema from '../validators/product.validator.js';

const router = Router();

router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);

router.post('/', auth, allow('admin'), validate(productSchema), ctrl.create);
router.put('/:id', auth, allow('admin'), validate(productSchema), ctrl.update);
router.delete('/:id', auth, allow('admin'), ctrl.remove);

export default router;
