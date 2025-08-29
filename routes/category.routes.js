import { Router } from 'express';
import * as ctrl from '../controllers/category.controller.js';
import auth from '../middlewares/auth.middleware.js';
import allow from '../middlewares/role.middleware.js';
import validate from '../middlewares/validate.middleware.js';
import categorySchema from '../validators/category.validator.js';

const router = Router();

router.get('/', ctrl.list);
router.get('/:id', ctrl.getOne);


router.post('/', auth, allow('admin'), validate(categorySchema), ctrl.create);


router.post('/many', auth, allow('admin'), ctrl.createMany);


router.put('/:id', auth, allow('admin'), validate(categorySchema), ctrl.update);


router.delete('/:id', auth, allow('admin'), ctrl.remove);

export default router;
