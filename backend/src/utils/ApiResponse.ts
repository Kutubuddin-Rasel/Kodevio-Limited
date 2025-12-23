import { Response } from 'express';

class ApiResponse<T = unknown> {
    public success: boolean;
    public statusCode: number;
    public message: string;
    public data?: T;
    public meta?: Record<string, unknown>;

    constructor(success: boolean, statusCode: number, message: string, data?: T, meta?: Record<string, unknown>) {
        this.success = success;
        this.statusCode = statusCode;
        this.message = message;
        if (data !== undefined) this.data = data;
        if (meta !== undefined) this.meta = meta;
    }

    static success<T>(res: Response, data: T, message: string = 'Success', statusCode: number = 200, meta?: Record<string, unknown>): Response {
        const response = new ApiResponse(true, statusCode, message, data, meta);
        return res.status(statusCode).json(response);
    }

    static created<T>(res: Response, data: T, message: string = 'Created successfully'): Response {
        return ApiResponse.success(res, data, message, 201);
    }

    static noContent(res: Response): Response {
        return res.status(204).send();
    }

    static error(res: Response, message: string, statusCode: number = 500, code?: string): Response {
        const response = { success: false, statusCode, message, ...(code && { code }) };
        return res.status(statusCode).json(response);
    }

    static paginated<T>(res: Response, data: T[], page: number, limit: number, total: number, message: string = 'Success'): Response {
        const totalPages = Math.ceil(total / limit);
        const meta = {
            pagination: { page, limit, total, totalPages, hasNextPage: page < totalPages, hasPrevPage: page > 1 },
        };
        return ApiResponse.success(res, data, message, 200, meta);
    }
}

export default ApiResponse;
