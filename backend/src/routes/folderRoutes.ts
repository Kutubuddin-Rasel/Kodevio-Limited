import { Router } from 'express';
import { body, param } from 'express-validator';
import * as folderController from '../controllers/folderController';
import { authenticate, validate } from '../middleware';

const router = Router();
router.use(authenticate);

const createFolderValidation = [
    body('name').trim().notEmpty().withMessage('Folder name is required').isLength({ max: 255 }).withMessage('Folder name cannot exceed 255 characters'),
    body('parentId').optional().isMongoId().withMessage('Invalid parent folder ID'),
    body('color').optional().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Invalid color format'),
];

const updateFolderValidation = [
    param('id').isMongoId().withMessage('Invalid folder ID'),
    body('name').optional().trim().notEmpty().withMessage('Folder name cannot be empty').isLength({ max: 255 }).withMessage('Folder name cannot exceed 255 characters'),
    body('color').optional().matches(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/).withMessage('Invalid color format'),
];

const folderIdValidation = [param('id').isMongoId().withMessage('Invalid folder ID')];

const copyValidation = [
    param('id').isMongoId().withMessage('Invalid folder ID'),
    body('targetFolderId').optional({ nullable: true }).isMongoId().withMessage('Invalid target folder ID'),
];

router.post('/', validate(createFolderValidation), folderController.createFolder);
router.get('/', folderController.getRootFolders);
router.get('/:id', validate(folderIdValidation), folderController.getFolderById);
router.get('/:id/contents', validate(folderIdValidation), folderController.getFolderContents);
router.put('/:id', validate(updateFolderValidation), folderController.updateFolder);
router.put('/:id/favorite', validate(folderIdValidation), folderController.toggleFavorite);
router.post('/:id/duplicate', validate(folderIdValidation), folderController.duplicateFolder);
router.post('/:id/copy', validate(copyValidation), folderController.copyFolder);
router.delete('/:id', validate(folderIdValidation), folderController.deleteFolder);

export default router;
