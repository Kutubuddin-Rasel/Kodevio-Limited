import { Router } from 'express';
import * as authController from '../controllers/authController';
import { authenticate, validateBody, authLimiter } from '../middleware';
import { loginSchema, registerSchema, forgotPasswordSchema, verifyOTPSchema, resetPasswordSchema } from '../validation';

const router = Router();

router.post('/register', authLimiter, validateBody(registerSchema), authController.register);
router.post('/login', authLimiter, validateBody(loginSchema), authController.login);
router.post('/forgot-password', authLimiter, validateBody(forgotPasswordSchema), authController.forgotPassword);
router.post('/verify-otp', authLimiter, validateBody(verifyOTPSchema), authController.verifyOTP);
router.post('/reset-password', authLimiter, validateBody(resetPasswordSchema), authController.resetPassword);

router.get('/me', authenticate, authController.getMe);
router.post('/refresh-token', authenticate, authController.refreshToken);
router.post('/logout', authenticate, authController.logout);

export default router;
