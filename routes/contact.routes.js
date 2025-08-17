import { Router } from 'express';
import * as ctrl from '../controllers/contact.controller.js';
import validate from '../middlewares/validate.middleware.js';
import contactSchema from '../validators/contact.validator.js';

const router = Router();

router.post('/contact', validate(contactSchema), ctrl.sendMessage);

export default router;
