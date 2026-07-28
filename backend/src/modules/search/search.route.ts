import { Router } from 'express';
import { searchController } from './search.controller';

const router = Router();

router.get('/', searchController.search);
router.get('/suggestions', searchController.suggestions);

export default router;
