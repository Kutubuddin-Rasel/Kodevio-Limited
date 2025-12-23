import { z } from 'zod';

export const loginSchema = z.object({
    email: z.string().email('Please provide a valid email').trim().toLowerCase(),
    password: z.string().min(1, 'Password is required'),
});

export const registerSchema = z.object({
    email: z.string().email('Please provide a valid email').trim().toLowerCase(),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    firstName: z.string().trim().min(1, 'First name is required').max(50, 'First name cannot exceed 50 characters'),
    lastName: z.string().trim().max(50, 'Last name cannot exceed 50 characters').optional(),
});

export const forgotPasswordSchema = z.object({
    email: z.string().email('Please provide a valid email').trim().toLowerCase(),
});

export const verifyOTPSchema = z.object({
    email: z.string().email('Please provide a valid email').trim().toLowerCase(),
    otp: z.string().length(6, 'OTP must be 6 digits').regex(/^\d+$/, 'OTP must be numeric'),
});

export const resetPasswordSchema = z.object({
    email: z.string().email('Please provide a valid email').trim().toLowerCase(),
    otp: z.string().length(6, 'OTP must be 6 digits'),
    newPassword: z.string().min(6, 'Password must be at least 6 characters'),
});

export const changePasswordSchema = z.object({
    currentPassword: z.string().min(1, 'Current password is required'),
    newPassword: z.string().min(6, 'New password must be at least 6 characters'),
});

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;
export type ForgotPasswordInput = z.infer<typeof forgotPasswordSchema>;
export type VerifyOTPInput = z.infer<typeof verifyOTPSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
