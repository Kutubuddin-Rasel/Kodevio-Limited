import { Request, Response } from 'express';
import { Folder, File, Note } from '../models';
import { ApiResponse, asyncHandler, getDateRange } from '../utils';
import { IUserDocument, FileType } from '../types';

export const getRecentItems = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUserDocument;
    const userId = user._id;
    const limit = parseInt(req.query.limit as string) || 50;

    const [folders, files, notes] = await Promise.all([
        Folder.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean(),
        File.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean(),
        Note.find({ userId }).sort({ createdAt: -1 }).limit(limit).lean(),
    ]);

    const typedFolders = folders.map(f => ({ ...f, entityType: 'folder' }));
    const typedFiles = files.map(f => ({ ...f, entityType: 'file' }));
    const typedNotes = notes.map(n => ({ ...n, entityType: 'note' }));

    const allItems = [...typedFolders, ...typedFiles, ...typedNotes]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
        .slice(0, limit);

    ApiResponse.success(res, { items: allItems, count: allItems.length }, 'Recent items retrieved successfully');
});

export const getItemsByDate = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUserDocument;
    const userId = user._id;
    const { date } = req.query;

    if (!date || typeof date !== 'string') {
        ApiResponse.success(res, { items: [], count: 0, date: null }, 'No date provided');
        return;
    }

    const { startOfDay, endOfDay } = getDateRange(date);
    const dateFilter = { userId, createdAt: { $gte: startOfDay, $lte: endOfDay } };

    const [folders, files, notes] = await Promise.all([
        Folder.find(dateFilter).lean(),
        File.find(dateFilter).lean(),
        Note.find(dateFilter).lean(),
    ]);

    const typedFolders = folders.map(f => ({ ...f, entityType: 'folder' }));
    const typedFiles = files.map(f => ({ ...f, entityType: 'file' }));
    const typedNotes = notes.map(n => ({ ...n, entityType: 'note' }));

    const allItems = [...typedFolders, ...typedFiles, ...typedNotes]
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    ApiResponse.success(res, {
        items: allItems,
        count: allItems.length,
        date,
        breakdown: { folders: folders.length, files: files.length, notes: notes.length },
    }, allItems.length > 0 ? 'Items retrieved successfully' : 'No items found for this date');
});

export const getMonthOverview = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUserDocument;
    const userId = user._id;
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;

    const startOfMonth = new Date(year, month - 1, 1);
    const endOfMonth = new Date(year, month, 0, 23, 59, 59, 999);
    const dateFilter = { userId, createdAt: { $gte: startOfMonth, $lte: endOfMonth } };

    const [foldersByDay, filesByDay, notesByDay] = await Promise.all([
        Folder.aggregate([{ $match: dateFilter }, { $group: { _id: { $dayOfMonth: '$createdAt' }, count: { $sum: 1 } } }]),
        File.aggregate([{ $match: dateFilter }, { $group: { _id: { $dayOfMonth: '$createdAt' }, count: { $sum: 1 } } }]),
        Note.aggregate([{ $match: dateFilter }, { $group: { _id: { $dayOfMonth: '$createdAt' }, count: { $sum: 1 } } }]),
    ]);

    const daysWithItems: Record<number, { folders: number; files: number; notes: number; total: number }> = {};

    foldersByDay.forEach(item => {
        if (!daysWithItems[item._id]) daysWithItems[item._id] = { folders: 0, files: 0, notes: 0, total: 0 };
        daysWithItems[item._id].folders = item.count;
        daysWithItems[item._id].total += item.count;
    });

    filesByDay.forEach(item => {
        if (!daysWithItems[item._id]) daysWithItems[item._id] = { folders: 0, files: 0, notes: 0, total: 0 };
        daysWithItems[item._id].files = item.count;
        daysWithItems[item._id].total += item.count;
    });

    notesByDay.forEach(item => {
        if (!daysWithItems[item._id]) daysWithItems[item._id] = { folders: 0, files: 0, notes: 0, total: 0 };
        daysWithItems[item._id].notes = item.count;
        daysWithItems[item._id].total += item.count;
    });

    ApiResponse.success(res, { year, month, daysWithItems, activeDays: Object.keys(daysWithItems).length }, 'Month overview retrieved successfully');
});

export const getFavorites = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUserDocument;
    const userId = user._id;

    const [folders, files, notes] = await Promise.all([
        Folder.find({ userId, isFavorite: true }).lean(),
        File.find({ userId, isFavorite: true }).lean(),
        Note.find({ userId, isFavorite: true }).lean(),
    ]);

    const typedFolders = folders.map(f => ({ ...f, entityType: 'folder' }));
    const typedFiles = files.map(f => ({ ...f, entityType: 'file' }));
    const typedNotes = notes.map(n => ({ ...n, entityType: 'note' }));

    const allItems = [...typedFolders, ...typedFiles, ...typedNotes]
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    ApiResponse.success(res, {
        items: allItems,
        count: allItems.length,
        breakdown: { folders: folders.length, files: files.length, notes: notes.length },
    }, 'Favorites retrieved successfully');
});

export const globalSearch = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUserDocument;
    const userId = user._id;
    const { q, type } = req.query;

    if (!q || typeof q !== 'string' || q.trim().length === 0) {
        ApiResponse.success(res, { items: [], count: 0, query: '' }, 'No search query provided');
        return;
    }

    const searchQuery = q.trim();
    const searchRegex = new RegExp(searchQuery, 'i');

    let folders: unknown[] = [];
    let files: unknown[] = [];
    let notes: unknown[] = [];

    if (!type || type === 'folder') {
        folders = await Folder.find({ userId, name: searchRegex }).lean();
    }

    if (!type || type === 'file' || type === 'image' || type === 'pdf') {
        const fileQuery: { userId: typeof userId; name: RegExp; fileType?: FileType } = { userId, name: searchRegex };
        if (type === 'image') fileQuery.fileType = 'image';
        if (type === 'pdf') fileQuery.fileType = 'pdf';
        files = await File.find(fileQuery).lean();
    }

    if (!type || type === 'note') {
        notes = await Note.find({ userId, $or: [{ title: searchRegex }, { content: searchRegex }] }).lean();
    }

    const typedFolders = folders.map(f => ({ ...(f as object), entityType: 'folder' }));
    const typedFiles = files.map(f => ({ ...(f as object), entityType: 'file' }));
    const typedNotes = notes.map(n => ({ ...(n as object), entityType: 'note' }));

    interface SearchResult extends Record<string, unknown> { updatedAt: Date; entityType: string; }
    const allItems = ([...typedFolders, ...typedFiles, ...typedNotes] as SearchResult[])
        .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    ApiResponse.success(res, {
        items: allItems,
        count: allItems.length,
        query: searchQuery,
        breakdown: { folders: folders.length, files: files.length, notes: notes.length },
    }, `Found ${allItems.length} result(s)`);
});
