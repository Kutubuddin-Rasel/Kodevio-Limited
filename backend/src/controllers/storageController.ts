import { Request, Response } from 'express';
import { Folder, File, Note } from '../models';
import { ApiResponse, asyncHandler, formatBytes } from '../utils';
import { IUserDocument, IFileModel } from '../types';

export const getStorageStats = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUserDocument;
    const total = user.storageLimit;
    const used = user.usedStorage;
    const available = total - used;
    const percentage = user.getStoragePercentage();

    ApiResponse.success(res, {
        total,
        used,
        available,
        percentage,
        formatted: {
            total: formatBytes(total),
            used: formatBytes(used),
            available: formatBytes(available),
        },
    }, 'Storage stats retrieved successfully');
});

export const getStorageBreakdown = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUserDocument;
    const userId = user._id;

    const [folderCount, noteCount, fileBreakdown] = await Promise.all([
        Folder.countDocuments({ userId }),
        Note.countDocuments({ userId }),
        (File as unknown as IFileModel).calculateStorageByType(userId),
    ]);

    const totalUsed = fileBreakdown.images.size + fileBreakdown.pdfs.size;
    const totalItems = folderCount + noteCount + fileBreakdown.images.count + fileBreakdown.pdfs.count;

    ApiResponse.success(res, {
        folders: { count: folderCount },
        notes: { count: noteCount },
        images: { count: fileBreakdown.images.count, size: fileBreakdown.images.size, sizeFormatted: formatBytes(fileBreakdown.images.size) },
        pdfs: { count: fileBreakdown.pdfs.count, size: fileBreakdown.pdfs.size, sizeFormatted: formatBytes(fileBreakdown.pdfs.size) },
        summary: { totalItems, totalUsed, totalUsedFormatted: formatBytes(totalUsed) },
    }, 'Storage breakdown retrieved successfully');
});

export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUserDocument;
    const userId = user._id;

    const [folderCount, noteCount, fileBreakdown, recentFiles] = await Promise.all([
        Folder.countDocuments({ userId }),
        Note.countDocuments({ userId }),
        (File as unknown as IFileModel).calculateStorageByType(userId),
        File.find({ userId }).sort({ createdAt: -1 }).limit(5),
    ]);

    const storage = {
        total: user.storageLimit,
        used: user.usedStorage,
        available: user.storageLimit - user.usedStorage,
        percentage: user.getStoragePercentage(),
        formatted: {
            total: formatBytes(user.storageLimit),
            used: formatBytes(user.usedStorage),
            available: formatBytes(user.storageLimit - user.usedStorage),
        },
    };

    const breakdown = {
        folders: { count: folderCount },
        notes: { count: noteCount },
        images: { count: fileBreakdown.images.count, size: fileBreakdown.images.size, sizeFormatted: formatBytes(fileBreakdown.images.size) },
        pdfs: { count: fileBreakdown.pdfs.count, size: fileBreakdown.pdfs.size, sizeFormatted: formatBytes(fileBreakdown.pdfs.size) },
    };

    ApiResponse.success(res, {
        storage,
        breakdown,
        totalItems: folderCount + noteCount + fileBreakdown.images.count + fileBreakdown.pdfs.count,
        recentFiles,
    }, 'Dashboard stats retrieved successfully');
});
