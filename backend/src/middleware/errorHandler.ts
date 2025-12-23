import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils';
import config from '../config';
import { formatBytes } from '../utils/helpers';

interface MongoError extends Error {
    code?: number;
    keyValue?: Record<string, unknown>;
}

interface MulterError extends Error {
    code?: string;
    field?: string;
}

export const errorHandler = (err: Error, _req: Request, res: Response, _next: NextFunction): void => {
    let statusCode = 500;
    let message = 'Internal Server Error';
    let code: string | undefined;

    if (err instanceof ApiError) {
        statusCode = err.statusCode;
        message = err.message;
        code = err.code;
    } else if (err.name === 'ValidationError') {
        statusCode = 400;
        message = err.message;
        code = 'VALIDATION_ERROR';
    } else if (err.name === 'CastError') {
        statusCode = 400;
        message = 'Invalid ID format';
        code = 'INVALID_ID';
    } else if ((err as MongoError).code === 11000) {
        statusCode = 409;
        const mongoErr = err as MongoError;
        const field = Object.keys(mongoErr.keyValue || {})[0] || 'field';
        message = `Duplicate value for ${field}`;
        code = 'DUPLICATE_KEY';
    } else if (err.name === 'JsonWebTokenError') {
        statusCode = 401;
        message = 'Invalid token';
        code = 'INVALID_TOKEN';
    } else if (err.name === 'TokenExpiredError') {
        statusCode = 401;
        message = 'Token expired';
        code = 'TOKEN_EXPIRED';
    } else if (err.name === 'MulterError') {
        statusCode = 400;
        const multerError = err as MulterError;
        if (multerError.code === 'LIMIT_FILE_SIZE') {
            message = `File too large. Maximum size is ${formatBytes(config.maxFileSize)}`;
        } else if (multerError.code === 'LIMIT_FILE_COUNT') {
            message = 'Too many files. Maximum is 10 files per upload';
        } else {
            message = multerError.message;
        }
        code = 'FILE_UPLOAD_ERROR';
    }

    if (config.env === 'development') {
        console.error('Error:', { message: err.message, stack: err.stack, statusCode });
    }

    res.status(statusCode).json({
        success: false,
        statusCode,
        message,
        ...(code && { code }),
        ...(config.env === 'development' && { stack: err.stack }),
    });
};

export const notFoundHandler = (req: Request, _res: Response, next: NextFunction): void => {
    next(ApiError.notFound(`Route ${req.originalUrl}`));
};

export const asyncHandler = <T>(fn: (req: Request, res: Response, next: NextFunction) => Promise<T>) => {
    return (req: Request, res: Response, next: NextFunction): void => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};
