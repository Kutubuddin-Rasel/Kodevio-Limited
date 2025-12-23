import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models';
import { ApiError } from '../utils';
import config from '../config';
import { IAuthPayload } from '../types';

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            throw ApiError.unauthorized('No token provided');
        }

        const token = authHeader.split(' ')[1];
        if (!token) throw ApiError.unauthorized('No token provided');

        const decoded = jwt.verify(token, config.jwt.secret) as IAuthPayload;
        const user = await User.findById(decoded.userId);

        if (!user) throw ApiError.unauthorized('User not found');
        if (!user.isActive) throw ApiError.unauthorized('Account is deactivated');

        req.user = user;
        next();
    } catch (error) {
        if (error instanceof jwt.JsonWebTokenError) {
            next(ApiError.unauthorized('Invalid token'));
        } else if (error instanceof jwt.TokenExpiredError) {
            next(ApiError.unauthorized('Token expired'));
        } else {
            next(error);
        }
    }
};

export const optionalAuth = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;

        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }

        const token = authHeader.split(' ')[1];
        if (!token) return next();

        const decoded = jwt.verify(token, config.jwt.secret) as IAuthPayload;
        const user = await User.findById(decoded.userId);

        if (user && user.isActive) {
            req.user = user;
        }

        next();
    } catch {
        next();
    }
};
