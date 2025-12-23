import { Request, Response } from 'express';
import { ApiError, ApiResponse, asyncHandler, generateOTPWithExpiry, isOTPExpired, logger } from '../utils';
import { authService } from '../services/AuthService';
import { emailService } from '../services/EmailService';
import config from '../config';
import { User } from '../models';
import { IRegisterRequest, ILoginRequest, IForgotPasswordRequest, IVerifyOTPRequest, IResetPasswordRequest, IUserDocument } from '../types';

const OTP_LENGTH = 6;
const OTP_EXPIRY_MINUTES = 10;

export const register = asyncHandler(async (req: Request, res: Response) => {
    const data = req.body as IRegisterRequest;
    const user = await authService.createUser(data);
    const { accessToken, refreshToken } = authService.generateTokens(user._id.toString(), user.email);
    authService.setRefreshTokenCookie(res, refreshToken);

    logger.info(`User registered: ${user.email}`);
    ApiResponse.created(res, {
        user: authService.formatUserResponse(user),
        accessToken,
        expiresIn: config.jwt.expiresIn,
    }, 'Registration successful');
});

export const login = asyncHandler(async (req: Request, res: Response) => {
    const { email, password } = req.body as ILoginRequest;
    const user = await authService.findUserByEmail(email);

    if (!user) throw ApiError.unauthorized('Invalid email or password');
    if (!user.isActive) throw ApiError.unauthorized('Account is deactivated');

    const isMatch = await authService.validatePassword(user, password);
    if (!isMatch) throw ApiError.unauthorized('Invalid email or password');

    await authService.updateLastLogin(user);
    const { accessToken, refreshToken } = authService.generateTokens(user._id.toString(), user.email);
    authService.setRefreshTokenCookie(res, refreshToken);

    logger.info(`User logged in: ${email}`);
    ApiResponse.success(res, {
        user: authService.formatUserResponse(user),
        accessToken,
        expiresIn: config.jwt.expiresIn,
    }, 'Login successful');
});

export const getMe = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUserDocument;
    ApiResponse.success(res, authService.formatUserResponse(user, true), 'User retrieved successfully');
});

export const forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email } = req.body as IForgotPasswordRequest;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) {
        ApiResponse.success(res, null, 'If email exists, OTP will be sent');
        return;
    }

    const { otp, expiresAt } = generateOTPWithExpiry(OTP_LENGTH, OTP_EXPIRY_MINUTES);
    user.resetPasswordOTP = otp;
    user.resetPasswordExpires = expiresAt;
    await user.save();

    try {
        await emailService.sendOTP({ to: user.email, code: otp, expiryMinutes: OTP_EXPIRY_MINUTES });
    } catch (err) {
        logger.error(`Failed to send OTP email to ${user.email}`, err instanceof Error ? err.message : err);
        if (config.env !== 'development') throw new Error('Failed to send OTP email. Please try again.');
    }

    ApiResponse.success(res, {
        message: 'OTP sent to email',
        ...(config.env === 'development' && { otp }),
    }, 'OTP sent successfully');
});

export const verifyOTP = asyncHandler(async (req: Request, res: Response) => {
    const { email, otp } = req.body as IVerifyOTPRequest;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+resetPasswordOTP +resetPasswordExpires');

    if (!user || !user.resetPasswordOTP || !user.resetPasswordExpires) {
        throw ApiError.badRequest('Invalid or expired OTP');
    }
    if (isOTPExpired(user.resetPasswordExpires)) throw ApiError.badRequest('OTP has expired');
    if (user.resetPasswordOTP !== otp) throw ApiError.badRequest('Invalid OTP');

    ApiResponse.success(res, { verified: true, message: 'OTP verified. You can now reset your password.' }, 'OTP verified successfully');
});

export const resetPassword = asyncHandler(async (req: Request, res: Response) => {
    const { email, otp, newPassword } = req.body as IResetPasswordRequest;
    const user = await User.findOne({ email: email.toLowerCase() }).select('+resetPasswordOTP +resetPasswordExpires +password');

    if (!user || !user.resetPasswordOTP || !user.resetPasswordExpires) {
        throw ApiError.badRequest('Invalid or expired OTP');
    }
    if (isOTPExpired(user.resetPasswordExpires)) throw ApiError.badRequest('OTP has expired');
    if (user.resetPasswordOTP !== otp) throw ApiError.badRequest('Invalid OTP');

    user.password = newPassword;
    user.resetPasswordOTP = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    logger.info(`Password reset for: ${email}`);
    ApiResponse.success(res, null, 'Password reset successfully');
});

export const refreshToken = asyncHandler(async (req: Request, res: Response) => {
    const refreshTokenFromCookie = req.cookies?.refreshToken;
    if (!refreshTokenFromCookie) throw ApiError.unauthorized('Refresh token not found');

    const payload = authService.verifyRefreshToken(refreshTokenFromCookie);
    const user = await authService.findUserById(payload.userId);
    if (!user || !user.isActive) throw ApiError.unauthorized('User not found or inactive');

    const { accessToken, refreshToken: newRefreshToken } = authService.generateTokens(user._id.toString(), user.email);
    authService.setRefreshTokenCookie(res, newRefreshToken);

    ApiResponse.success(res, { accessToken, expiresIn: config.jwt.expiresIn }, 'Token refreshed successfully');
});

export const logout = asyncHandler(async (_req: Request, res: Response) => {
    authService.clearRefreshTokenCookie(res);
    ApiResponse.success(res, null, 'Logged out successfully');
});
