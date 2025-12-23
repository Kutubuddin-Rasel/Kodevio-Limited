import { Router } from 'express';
import { query } from 'express-validator';
import { getItemsByDate, getMonthOverview } from '../controllers/mixedController';
import { authenticate, validate } from '../middleware';

const router = Router();
router.use(authenticate);

const dateValidation = [query('date').optional().isISO8601().withMessage('Date must be in ISO 8601 format (YYYY-MM-DD)')];

const monthValidation = [
    query('year').optional().isInt({ min: 2000, max: 2100 }).withMessage('Year must be between 2000 and 2100'),
    query('month').optional().isInt({ min: 1, max: 12 }).withMessage('Month must be between 1 and 12'),
];

router.get('/', validate(dateValidation), getItemsByDate);
router.get('/month', validate(monthValidation), getMonthOverview);

export default router;
