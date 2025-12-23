import { Router } from 'express';
import { query } from 'express-validator';
import { globalSearch } from '../controllers/mixedController';
import { authenticate, validate } from '../middleware';

const router = Router();
router.use(authenticate);

const searchValidation = [
    query('q').optional().isString().withMessage('Search query must be a string').isLength({ max: 100 }).withMessage('Search query cannot exceed 100 characters'),
    query('type').optional().isIn(['folder', 'file', 'note', 'image', 'pdf']).withMessage('Type must be one of: folder, file, note, image, pdf'),
];

router.get('/', validate(searchValidation), globalSearch);

export default router;
