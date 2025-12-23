import { Router } from 'express';
import { getRecentItems } from '../controllers/mixedController';
import { authenticate } from '../middleware';

const router = Router();
router.use(authenticate);
router.get('/', getRecentItems);

export default router;
