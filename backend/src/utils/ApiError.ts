import config from '../config';
import { formatBytes } from './helpers';

class ApiError extends Error {
    public statusCode: number;
    public status: string;
    public isOperational: boolean;
    public code?: string;

    constructor(
        statusCode: number,
        message: string,
        code?: string,
        isOperational: boolean = true
    ) {
        super(message);

        this.statusCode = statusCode;
        this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
        this.isOperational = isOperational;
        this.code = code;

        Error.captureStackTrace(this, this.constructor);
    }

    static badRequest(message: string, code?: string): ApiError {
        return new ApiError(400, message, code);
    }

    static unauthorized(message: string = 'Unauthorized'): ApiError {
        return new ApiError(401, message, 'UNAUTHORIZED');
    }

    static forbidden(message: string = 'Forbidden'): ApiError {
        return new ApiError(403, message, 'FORBIDDEN');
    }

    static notFound(resource: string = 'Resource'): ApiError {
        return new ApiError(404, `${resource} not found`, 'NOT_FOUND');
    }

    static conflict(message: string): ApiError {
        return new ApiError(409, message, 'CONFLICT');
    }

    static validationError(message: string): ApiError {
        return new ApiError(422, message, 'VALIDATION_ERROR');
    }

    static storageQuotaExceeded(): ApiError {
        const limitFormatted = formatBytes(config.storageLimit);
        return new ApiError(
            403,
            `You have exceeded your ${limitFormatted} storage limit.`,
            'STORAGE_QUOTA_EXCEEDED'
        );
    }

    static tooManyRequests(message: string = 'Too many requests'): ApiError {
        return new ApiError(429, message, 'TOO_MANY_REQUESTS');
    }

    static internal(message: string = 'Internal server error'): ApiError {
        return new ApiError(500, message, 'INTERNAL_ERROR', false);
    }
}

export default ApiError;

