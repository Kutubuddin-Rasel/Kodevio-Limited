import { Request, Response } from 'express';
import { ApiError, ApiResponse, asyncHandler } from '../utils';
import { fileService } from '../services/FileService';
import { IUserDocument, ICopyRequest } from '../types';

export const uploadFiles = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUserDocument;
    const { parentId } = req.body;
    const files = req.files as Express.Multer.File[];

    if (!files || files.length === 0) throw ApiError.badRequest('No files provided');

    const totalSize = files.reduce((sum, file) => sum + file.size, 0);
    if (!user.hasAvailableStorage(totalSize)) throw ApiError.storageQuotaExceeded();

    const result = await fileService.uploadFiles(user._id, files, parentId);
    ApiResponse.created(res, { files: result.files, count: result.files.length, totalSize: result.totalSize }, 'Files uploaded successfully');
});

export const getFiles = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUserDocument;
    const { type, parentId } = req.query;
    const files = await fileService.getFiles(user._id, type as string, parentId as string);
    ApiResponse.success(res, files, 'Files retrieved successfully');
});

export const getImages = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUserDocument;
    const limit = parseInt(req.query.limit as string) || 100;
    const images = await fileService.getByType(user._id, 'image', limit);
    ApiResponse.success(res, images, 'Images retrieved successfully');
});

export const getPDFs = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUserDocument;
    const limit = parseInt(req.query.limit as string) || 100;
    const pdfs = await fileService.getByType(user._id, 'pdf', limit);
    ApiResponse.success(res, pdfs, 'PDFs retrieved successfully');
});

export const getFileById = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUserDocument;
    const file = await fileService.getById(user._id, req.params.id);
    ApiResponse.success(res, file, 'File retrieved successfully');
});

export const updateFile = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUserDocument;
    const file = await fileService.updateName(user._id, req.params.id, req.body.name);
    ApiResponse.success(res, file, 'File updated successfully');
});

export const toggleFavorite = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUserDocument;
    const result = await fileService.toggleFavorite(user._id, req.params.id);
    ApiResponse.success(res, result, `File ${result.isFavorite ? 'added to' : 'removed from'} favorites`);
});

export const duplicateFile = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUserDocument;
    const duplicatedFile = await fileService.duplicate(user._id, req.params.id, user);
    ApiResponse.created(res, duplicatedFile, 'File duplicated successfully');
});

export const copyFile = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUserDocument;
    const { targetFolderId } = req.body as ICopyRequest;
    const copiedFile = await fileService.copy(user._id, req.params.id, targetFolderId, user);
    ApiResponse.created(res, copiedFile, 'File copied successfully');
});

export const deleteFile = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUserDocument;
    const result = await fileService.delete(user._id, req.params.id);
    ApiResponse.success(res, result, 'File deleted successfully');
});

export const getFileInfo = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUserDocument;
    const file = await fileService.getById(user._id, req.params.id);

    ApiResponse.success(res, {
        id: file._id,
        name: file.name,
        originalName: file.originalName,
        mimeType: file.mimeType,
        fileType: file.fileType,
        size: file.size,
        sizeFormatted: file.getSizeFormatted(),
        url: file.url,
        thumbnailUrl: file.thumbnailUrl,
        isFavorite: file.isFavorite,
        parentId: file.parentId,
        createdAt: file.createdAt,
        updatedAt: file.updatedAt,
    }, 'File info retrieved successfully');
});
