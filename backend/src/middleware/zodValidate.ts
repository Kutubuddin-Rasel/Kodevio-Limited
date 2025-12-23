import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError, ZodIssue } from 'zod';
import { ApiError } from '../utils';

type ValidationTarget = 'body' | 'query' | 'params';

export const validateZod = (schema: ZodSchema, target: ValidationTarget = 'body') => {
    return (req: Request, _res: Response, next: NextFunction): void => {
        try {
            const data = schema.parse(req[target]);
            req[target] = data;
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                const message = error.issues.map((e: ZodIssue) => `${e.path.join('.')}: ${e.message}`).join(', ');
                next(ApiError.badRequest(message, 'VALIDATION_ERROR'));
            } else {
                next(error);
            }
        }
    };
};

export const validateBody = (schema: ZodSchema) => validateZod(schema, 'body');
export const validateQuery = (schema: ZodSchema) => validateZod(schema, 'query');
export const validateParams = (schema: ZodSchema) => validateZod(schema, 'params');

