import { Router } from 'express';
import { body } from 'express-validator';
import * as userController from '../controllers/userController';
import { authenticate, validate } from '../middleware';

const router = Router();
router.use(authenticate);

const updateProfileValidation = [
    body('firstName').optional().trim().notEmpty().withMessage('First name cannot be empty').isLength({ max: 50 }).withMessage('First name cannot exceed 50 characters'),
    body('lastName').optional().trim().isLength({ max: 50 }).withMessage('Last name cannot exceed 50 characters'),
    body('avatar').optional().isURL().withMessage('Avatar must be a valid URL'),
];

const changePasswordValidation = [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters'),
];

router.get('/profile', userController.getProfile);
router.put('/profile', validate(updateProfileValidation), userController.updateProfile);
router.put('/change-password', validate(changePasswordValidation), userController.changePassword);
router.delete('/account', userController.deleteAccount);

export default router;
