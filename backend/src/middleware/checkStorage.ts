import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils';
import { IUserDocument } from '../types';

export const checkStorageQuota = (requiredBytes?: number) => {
    return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const user = req.user as IUserDocument;

            if (!user) throw ApiError.unauthorized('Authentication required');

            if (requiredBytes !== undefined) {
                if (!user.hasAvailableStorage(requiredBytes)) {
                    throw ApiError.storageQuotaExceeded();
                }
                return next();
            }

            const availableStorage = user.storageLimit - user.usedStorage;
            if (availableStorage <= 0) throw ApiError.storageQuotaExceeded();

            next();
        } catch (error) {
            next(error);
        }
    };
};

export const validateFileSize = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const user = req.user as IUserDocument;
        const file = req.file;
        const files = req.files;

        if (!user) throw ApiError.unauthorized('Authentication required');

        let totalSize = 0;

        if (file) {
            totalSize = file.size;
        }

        if (files) {
            if (Array.isArray(files)) {
                totalSize = files.reduce((sum, f) => sum + f.size, 0);
            } else {
                Object.values(files).forEach((fileArray) => {
                    if (Array.isArray(fileArray)) {
                        totalSize += fileArray.reduce((sum, f) => sum + f.size, 0);
                    }
                });
            }
        }

        if (totalSize === 0) return next();
        if (!user.hasAvailableStorage(totalSize)) throw ApiError.storageQuotaExceeded();

        next();
    } catch (error) {
        next(error);
    }
};
