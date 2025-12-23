import { Router } from 'express';
import * as storageController from '../controllers/storageController';
import { authenticate } from '../middleware';

const router = Router();
router.use(authenticate);

router.get('/stats', storageController.getStorageStats);
router.get('/breakdown', storageController.getStorageBreakdown);
router.get('/dashboard', storageController.getDashboardStats);

export default router;
