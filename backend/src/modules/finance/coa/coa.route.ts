import { Router } from 'express';
import { coaController } from './coa.controller';
import { authenticate } from '../../../middlewares/auth.middleware';
import { validate } from '../../../middlewares/validation.middleware';
import { createCoaSchema, updateCoaSchema } from './coa.validation';

const router = Router();

router.get('/tree', coaController.tree);
router.get('/', authenticate, coaController.list);
router.get('/:id', authenticate, coaController.getById);
router.post('/', authenticate, validate(createCoaSchema), coaController.create);
router.put('/:id', authenticate, validate(updateCoaSchema), coaController.update);
router.delete('/:id', authenticate, coaController.delete);

export default router;
