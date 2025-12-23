import { Router } from 'express';
import { getFavorites } from '../controllers/mixedController';
import { authenticate } from '../middleware';

const router = Router();
router.use(authenticate);
router.get('/', getFavorites);

export default router;
