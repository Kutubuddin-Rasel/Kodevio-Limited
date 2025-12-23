import { Request, Response } from 'express';
import { ApiResponse, asyncHandler } from '../utils';
import { folderService } from '../services/FolderService';
import { ICreateFolderRequest, ICopyRequest, IUserDocument } from '../types';

export const createFolder = asyncHandler(async (req: Request, res: Response) => {
    const { name, parentId, color } = req.body as ICreateFolderRequest;
    const user = req.user as IUserDocument;
    const folder = await folderService.create(user._id, name, parentId || undefined, color);
    ApiResponse.created(res, folder, 'Folder created successfully');
});

export const getRootFolders = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUserDocument;
    const folders = await folderService.getRootFolders(user._id);
    ApiResponse.success(res, folders, 'Root folders retrieved successfully');
});

export const getFolderById = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUserDocument;
    const folder = await folderService.getById(user._id, req.params.id);
    ApiResponse.success(res, folder, 'Folder retrieved successfully');
});

export const getFolderContents = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUserDocument;
    const contents = await folderService.getContents(user._id, req.params.id);
    ApiResponse.success(res, contents, 'Folder contents retrieved successfully');
});

export const updateFolder = asyncHandler(async (req: Request, res: Response) => {
    const { name, color } = req.body;
    const user = req.user as IUserDocument;
    const folder = await folderService.update(user._id, req.params.id, name, color);
    ApiResponse.success(res, folder, 'Folder updated successfully');
});

export const toggleFavorite = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUserDocument;
    const result = await folderService.toggleFavorite(user._id, req.params.id);
    ApiResponse.success(res, result, `Folder ${result.isFavorite ? 'added to' : 'removed from'} favorites`);
});

export const duplicateFolder = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUserDocument;
    const duplicatedFolder = await folderService.duplicate(user._id, req.params.id);
    ApiResponse.created(res, duplicatedFolder, 'Folder duplicated successfully');
});

export const copyFolder = asyncHandler(async (req: Request, res: Response) => {
    const { targetFolderId } = req.body as ICopyRequest;
    const user = req.user as IUserDocument;
    const copiedFolder = await folderService.copy(user._id, req.params.id, targetFolderId || undefined);
    ApiResponse.created(res, copiedFolder, 'Folder copied successfully');
});

export const deleteFolder = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUserDocument;
    const result = await folderService.delete(user._id, req.params.id);
    ApiResponse.success(res, result, 'Folder and contents deleted successfully');
});
