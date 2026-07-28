import { Router } from 'express';
import { journalController } from './journal.controller';
import { authenticate } from '../../../middlewares/auth.middleware';
import { validate } from '../../../middlewares/validation.middleware';
import { createJournalSchema, updateJournalSchema, postJournalSchema } from './journal.validation';

const router = Router();

router.use(authenticate);

router.get('/', journalController.list);
router.get('/:id', journalController.getById);
router.post('/', validate(createJournalSchema), journalController.create);
router.put('/:id', validate(updateJournalSchema), journalController.update);
router.patch('/:id/status', validate(postJournalSchema), journalController.postJournal);
router.delete('/:id', journalController.delete);

export default router;
