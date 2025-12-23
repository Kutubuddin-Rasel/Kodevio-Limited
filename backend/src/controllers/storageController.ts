import { Request, Response } from 'express';
import { Folder, File, Note } from '../models';
import { ApiResponse, asyncHandler, formatBytes } from '../utils';
import { IUserDocument, IFileModel } from '../types';
import { Types, Model } from 'mongoose';
import { INoteDocument } from '../types';

interface INoteModelWithSize extends Model<INoteDocument> {
    calculateTotalContentSize(userId: Types.ObjectId): Promise<{ count: number; size: number }>;
}

interface IFileModelExtended extends IFileModel {
    calculateStorageInFolders(userId: Types.ObjectId): Promise<number>;
}

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

    const [folderCount, fileBreakdown, noteStats, folderStorage] = await Promise.all([
        Folder.countDocuments({ userId }),
        (File as unknown as IFileModel).calculateStorageByType(userId),
        (Note as unknown as INoteModelWithSize).calculateTotalContentSize(userId),
        (File as unknown as IFileModelExtended).calculateStorageInFolders(userId),
    ]);

    const totalUsed = fileBreakdown.images.size + fileBreakdown.pdfs.size;
    const totalItems = folderCount + noteStats.count + fileBreakdown.images.count + fileBreakdown.pdfs.count;

    ApiResponse.success(res, {
        folders: { count: folderCount, size: folderStorage, sizeFormatted: formatBytes(folderStorage) },
        notes: { count: noteStats.count, size: noteStats.size, sizeFormatted: formatBytes(noteStats.size) },
        images: { count: fileBreakdown.images.count, size: fileBreakdown.images.size, sizeFormatted: formatBytes(fileBreakdown.images.size) },
        pdfs: { count: fileBreakdown.pdfs.count, size: fileBreakdown.pdfs.size, sizeFormatted: formatBytes(fileBreakdown.pdfs.size) },
        summary: { totalItems, totalUsed, totalUsedFormatted: formatBytes(totalUsed) },
    }, 'Storage breakdown retrieved successfully');
});

export const getDashboardStats = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUserDocument;
    const userId = user._id;

    const [folderCount, fileBreakdown, noteStats, folderStorage, recentFiles] = await Promise.all([
        Folder.countDocuments({ userId }),
        (File as unknown as IFileModel).calculateStorageByType(userId),
        (Note as unknown as INoteModelWithSize).calculateTotalContentSize(userId),
        (File as unknown as IFileModelExtended).calculateStorageInFolders(userId),
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
        folders: { count: folderCount, size: folderStorage, sizeFormatted: formatBytes(folderStorage) },
        notes: { count: noteStats.count, size: noteStats.size, sizeFormatted: formatBytes(noteStats.size) },
        images: { count: fileBreakdown.images.count, size: fileBreakdown.images.size, sizeFormatted: formatBytes(fileBreakdown.images.size) },
        pdfs: { count: fileBreakdown.pdfs.count, size: fileBreakdown.pdfs.size, sizeFormatted: formatBytes(fileBreakdown.pdfs.size) },
    };

    ApiResponse.success(res, {
        storage,
        breakdown,
        totalItems: folderCount + noteStats.count + fileBreakdown.images.count + fileBreakdown.pdfs.count,
        recentFiles,
    }, 'Dashboard stats retrieved successfully');
});
