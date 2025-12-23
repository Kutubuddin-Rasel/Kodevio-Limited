import rateLimit from 'express-rate-limit';
import { ApiError } from '../utils';
import config from '../config';

export const authLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.authMax,
    message: 'Too many authentication attempts, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res, next) => {
        next(ApiError.tooManyRequests('Too many authentication attempts, please try again later'));
    },
    skip: () => config.env === 'test' || config.env === 'development',
});

export const apiLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.apiMax,
    message: 'Too many requests, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res, next) => {
        next(ApiError.tooManyRequests('Too many requests, please try again later'));
    },
    skip: () => config.env === 'test',
});

export const uploadLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: config.rateLimit.uploadMax,
    message: 'Too many uploads, please try again later',
    standardHeaders: true,
    legacyHeaders: false,
    handler: (_req, _res, next) => {
        next(ApiError.tooManyRequests('Too many uploads, please try again later'));
    },
    skip: () => config.env === 'test',
});
