import { Types } from 'mongoose';
import mongoose from 'mongoose';
import { Folder, File, Note } from '../models';
import { ApiError, appendCopySuffix } from '../utils';
import { storageService } from './StorageService';
import { IFolderDocument, IFolderModel, IFileDocument, INoteDocument } from '../types';

interface FolderContents {
    folder: IFolderDocument;
    ancestors: IFolderDocument[];
    contents: {
        folders: IFolderDocument[];
        files: IFileDocument[];
        notes: INoteDocument[];
    };
    counts: {
        folders: number;
        files: number;
        notes: number;
        total: number;
    };
}

interface DeleteResult {
    deletedFolders: number;
    deletedFiles: number;
    freedStorage: number;
}

class FolderService {
    async create(userId: Types.ObjectId, name: string, parentId?: string, color?: string): Promise<IFolderDocument> {
        if (parentId) {
            const parentFolder = await Folder.findOne({ _id: parentId, userId });
            if (!parentFolder) throw ApiError.notFound('Parent folder');
        }
        return Folder.create({ userId, name, parentId: parentId || null, color });
    }

    async getRootFolders(userId: Types.ObjectId): Promise<IFolderDocument[]> {
        return Folder.find({ userId, parentId: null }).sort({ name: 1 });
    }

    async getById(userId: Types.ObjectId, folderId: string): Promise<IFolderDocument> {
        const folder = await Folder.findOne({ _id: folderId, userId });
        if (!folder) throw ApiError.notFound('Folder');
        return folder;
    }

    async getContents(userId: Types.ObjectId, folderId: string): Promise<FolderContents> {
        const folder = await Folder.findOne({ _id: folderId, userId });
        if (!folder) throw ApiError.notFound('Folder');

        const [subfolders, files, notes, ancestors] = await Promise.all([
            Folder.find({ userId, parentId: folderId }).sort({ name: 1 }),
            File.find({ userId, parentId: folderId }).sort({ name: 1 }),
            Note.find({ userId, parentId: folderId }).sort({ updatedAt: -1 }),
            (Folder as unknown as IFolderModel).getAncestors(new mongoose.Types.ObjectId(folderId)),
        ]);

        return {
            folder,
            ancestors,
            contents: { folders: subfolders, files, notes },
            counts: {
                folders: subfolders.length,
                files: files.length,
                notes: notes.length,
                total: subfolders.length + files.length + notes.length,
            },
        };
    }

    async update(userId: Types.ObjectId, folderId: string, name?: string, color?: string): Promise<IFolderDocument> {
        const folder = await Folder.findOneAndUpdate(
            { _id: folderId, userId },
            { name, color, updatedAt: new Date() },
            { new: true, runValidators: true }
        );
        if (!folder) throw ApiError.notFound('Folder');
        return folder;
    }

    async toggleFavorite(userId: Types.ObjectId, folderId: string): Promise<{ id: Types.ObjectId; isFavorite: boolean }> {
        const folder = await Folder.findOne({ _id: folderId, userId });
        if (!folder) throw ApiError.notFound('Folder');

        folder.isFavorite = !folder.isFavorite;
        await folder.save();

        return { id: folder._id, isFavorite: folder.isFavorite };
    }

    async duplicate(userId: Types.ObjectId, folderId: string): Promise<IFolderDocument> {
        const originalFolder = await Folder.findOne({ _id: folderId, userId });
        if (!originalFolder) throw ApiError.notFound('Folder');

        return Folder.create({
            userId,
            name: appendCopySuffix(originalFolder.name),
            parentId: originalFolder.parentId,
            color: originalFolder.color,
            isFavorite: false,
        });
    }

    async copy(userId: Types.ObjectId, folderId: string, targetFolderId?: string): Promise<IFolderDocument> {
        const originalFolder = await Folder.findOne({ _id: folderId, userId });
        if (!originalFolder) throw ApiError.notFound('Folder');

        if (targetFolderId) {
            const targetFolder = await Folder.findOne({ _id: targetFolderId, userId });
            if (!targetFolder) throw ApiError.notFound('Target folder');
            if (targetFolderId === folderId) throw ApiError.badRequest('Cannot copy folder into itself');
        }

        return Folder.create({
            userId,
            name: appendCopySuffix(originalFolder.name),
            parentId: targetFolderId || null,
            color: originalFolder.color,
            isFavorite: false,
        });
    }

    async delete(userId: Types.ObjectId, folderId: string): Promise<DeleteResult> {
        const folder = await Folder.findOne({ _id: folderId, userId });
        if (!folder) throw ApiError.notFound('Folder');

        const descendantIds = await folder.getAllDescendantIds();
        const allFolderIds = [folder._id, ...descendantIds];

        const filesToDelete = await File.find({ userId, parentId: { $in: allFolderIds } });
        const totalFileSize = filesToDelete.reduce((sum, file) => sum + file.size, 0);

        await Promise.all([
            File.deleteMany({ userId, parentId: { $in: allFolderIds } }),
            Note.deleteMany({ userId, parentId: { $in: allFolderIds } }),
            Folder.deleteMany({ _id: { $in: allFolderIds } }),
        ]);

        if (totalFileSize > 0) {
            await storageService.decrementUsage(userId, totalFileSize);
        }

        return {
            deletedFolders: allFolderIds.length,
            deletedFiles: filesToDelete.length,
            freedStorage: totalFileSize,
        };
    }
}

export const folderService = new FolderService();
export default FolderService;
