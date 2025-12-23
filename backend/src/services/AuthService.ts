import jwt, { SignOptions } from 'jsonwebtoken';
import { User } from '../models';
import { ApiError } from '../utils';
import config from '../config';
import { IUserDocument, IAuthPayload } from '../types';
import { Response } from 'express';

const parseExpiryToMs = (expiry: string): number => {
    const match = expiry.match(/^(\d+)(m|h|d)$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000;
    const value = parseInt(match[1], 10);
    const unit = match[2];
    if (unit === 'm') return value * 60 * 1000;
    if (unit === 'h') return value * 60 * 60 * 1000;
    if (unit === 'd') return value * 24 * 60 * 60 * 1000;
    return 7 * 24 * 60 * 60 * 1000;
};

export interface ITokens {
    accessToken: string;
    refreshToken: string;
}

export interface IUserResponse {
    id: string;
    email: string;
    firstName: string;
    lastName?: string;
    avatar?: string;
    storageLimit: number;
    usedStorage: number;
    isVerified?: boolean;
    createdAt?: Date;
}

class AuthService {
    generateAccessToken(userId: string, email: string): string {
        const payload: IAuthPayload = { userId, email };
        const options: SignOptions = { expiresIn: parseExpiryToMs(config.jwt.expiresIn) / 1000 };
        return jwt.sign(payload, config.jwt.secret, options);
    }

    generateRefreshToken(userId: string, email: string): string {
        const payload: IAuthPayload = { userId, email };
        const options: SignOptions = { expiresIn: parseExpiryToMs(config.jwt.refreshExpiresIn) / 1000 };
        return jwt.sign(payload, config.jwt.refreshSecret, options);
    }

    generateTokens(userId: string, email: string): ITokens {
        return {
            accessToken: this.generateAccessToken(userId, email),
            refreshToken: this.generateRefreshToken(userId, email),
        };
    }

    setRefreshTokenCookie(res: Response, refreshToken: string): void {
        const isProduction = config.env === 'production';
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: isProduction,
            sameSite: isProduction ? 'strict' : 'lax',
            maxAge: parseExpiryToMs(config.jwt.refreshExpiresIn),
            path: '/api/auth',
        });
    }

    clearRefreshTokenCookie(res: Response): void {
        res.clearCookie('refreshToken', {
            httpOnly: true,
            secure: config.env === 'production',
            sameSite: config.env === 'production' ? 'strict' : 'lax',
            path: '/api/auth',
        });
    }

    verifyRefreshToken(token: string): IAuthPayload {
        try {
            return jwt.verify(token, config.jwt.refreshSecret) as IAuthPayload;
        } catch {
            throw ApiError.unauthorized('Invalid or expired refresh token');
        }
    }

    async findUserByEmail(email: string): Promise<IUserDocument | null> {
        return User.findOne({ email: email.toLowerCase() }).select('+password');
    }

    async findUserById(userId: string): Promise<IUserDocument | null> {
        return User.findById(userId);
    }

    async createUser(data: { email: string; password: string; firstName: string; lastName?: string }): Promise<IUserDocument> {
        const existingUser = await User.findOne({ email: data.email.toLowerCase() });
        if (existingUser) throw ApiError.conflict('Email already registered');
        return User.create({ ...data, storageLimit: config.storageLimit });
    }

    formatUserResponse(user: IUserDocument, includeDetails = false): IUserResponse {
        const response: IUserResponse = {
            id: user._id.toString(),
            email: user.email,
            firstName: user.firstName,
            lastName: user.lastName,
            avatar: user.avatar,
            storageLimit: user.storageLimit,
            usedStorage: user.usedStorage,
        };
        if (includeDetails) {
            response.isVerified = user.isVerified;
            response.createdAt = user.createdAt;
        }
        return response;
    }

    async validatePassword(user: IUserDocument, password: string): Promise<boolean> {
        return user.comparePassword(password);
    }

    async updateLastLogin(user: IUserDocument): Promise<void> {
        user.lastLoginAt = new Date();
        await user.save();
    }
}

export const authService = new AuthService();
export default AuthService;
