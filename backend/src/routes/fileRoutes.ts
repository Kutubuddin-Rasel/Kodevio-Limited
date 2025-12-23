import { Router } from 'express';
import * as fileController from '../controllers/fileController';
import { authenticate, validateBody, validateParams, uploadFiles, uploadLimiter } from '../middleware';
import { uploadFileSchema, updateFileSchema, copyFileSchema, mongoIdParamSchema } from '../validation';

const router = Router();
router.use(authenticate);

router.post('/upload', uploadLimiter, uploadFiles.array('files', 10), validateBody(uploadFileSchema), fileController.uploadFiles);
router.get('/', fileController.getFiles);
router.get('/images', fileController.getImages);
router.get('/pdfs', fileController.getPDFs);
router.get('/:id', validateParams(mongoIdParamSchema), fileController.getFileById);
router.get('/:id/info', validateParams(mongoIdParamSchema), fileController.getFileInfo);
router.put('/:id', validateParams(mongoIdParamSchema), validateBody(updateFileSchema), fileController.updateFile);
router.put('/:id/favorite', validateParams(mongoIdParamSchema), fileController.toggleFavorite);
router.post('/:id/duplicate', validateParams(mongoIdParamSchema), fileController.duplicateFile);
router.post('/:id/copy', validateParams(mongoIdParamSchema), validateBody(copyFileSchema), fileController.copyFile);
router.delete('/:id', validateParams(mongoIdParamSchema), fileController.deleteFile);

export default router;
