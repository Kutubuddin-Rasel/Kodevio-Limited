import { Router } from 'express';
import { body, param } from 'express-validator';
import * as noteController from '../controllers/noteController';
import { authenticate, validate } from '../middleware';

const router = Router();
router.use(authenticate);

const createNoteValidation = [
    body('title').trim().notEmpty().withMessage('Note title is required').isLength({ max: 255 }).withMessage('Note title cannot exceed 255 characters'),
    body('content').optional().isLength({ max: 100000 }).withMessage('Note content cannot exceed 100,000 characters'),
    body('parentId').optional().isMongoId().withMessage('Invalid parent folder ID'),
    body('color').optional().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Invalid color format'),
];

const updateNoteValidation = [
    param('id').isMongoId().withMessage('Invalid note ID'),
    body('title').optional().trim().notEmpty().withMessage('Note title cannot be empty').isLength({ max: 255 }).withMessage('Note title cannot exceed 255 characters'),
    body('content').optional().isLength({ max: 100000 }).withMessage('Note content cannot exceed 100,000 characters'),
    body('color').optional().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Invalid color format'),
];

const noteIdValidation = [param('id').isMongoId().withMessage('Invalid note ID')];

const copyValidation = [
    param('id').isMongoId().withMessage('Invalid note ID'),
    body('targetFolderId').optional({ nullable: true }).isMongoId().withMessage('Invalid target folder ID'),
];

router.post('/', validate(createNoteValidation), noteController.createNote);
router.get('/', noteController.getNotes);
router.get('/:id', validate(noteIdValidation), noteController.getNoteById);
router.put('/:id', validate(updateNoteValidation), noteController.updateNote);
router.put('/:id/favorite', validate(noteIdValidation), noteController.toggleFavorite);
router.post('/:id/duplicate', validate(noteIdValidation), noteController.duplicateNote);
router.post('/:id/copy', validate(copyValidation), noteController.copyNote);
router.delete('/:id', validate(noteIdValidation), noteController.deleteNote);

export default router;
