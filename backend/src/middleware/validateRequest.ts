import { Request, Response, NextFunction } from 'express';
import { validationResult, ValidationChain } from 'express-validator';
import { ApiError } from '../utils';

export const validate = (validations: ValidationChain[]) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        await Promise.all(validations.map((validation) => validation.run(req)));

        const errors = validationResult(req);

        if (errors.isEmpty()) return next();

        const formattedErrors = errors.array().map((error) => ({
            field: 'path' in error ? error.path : 'unknown',
            message: error.msg,
        }));

        next(ApiError.validationError(`Validation failed: ${formattedErrors.map((e) => e.message).join(', ')}`));
    };
};

export const sanitizeBody = (req: Request, _res: Response, next: NextFunction): void => {
    if (req.body && typeof req.body === 'object') {
        Object.keys(req.body).forEach((key) => {
            if (req.body[key] === undefined || req.body[key] === null) {
                delete req.body[key];
            }
        });
    }
    next();
};
