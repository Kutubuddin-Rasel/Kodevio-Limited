import { Types } from 'mongoose';
import { File, Folder } from '../models';
import { ApiError, appendCopySuffix } from '../utils';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../config/cloudinary';
import { getFileType, getResourceType } from '../middleware/upload';
import { storageService } from './StorageService';
import { IFileDocument, IUserDocument, IFileQueryFilter, IFileModel, FileType } from '../types';

interface UploadResult {
    files: IFileDocument[];
    totalSize: number;
}

class FileService {
    async uploadFiles(
        userId: Types.ObjectId,
        files: Express.Multer.File[],
        parentId?: string
    ): Promise<UploadResult> {
        const uploadedFiles: IFileDocument[] = [];
        let totalSize = 0;

        for (const file of files) {
            const fileType = getFileType(file.mimetype);
            const resourceType = getResourceType(file.mimetype);

            const result = await uploadBufferToCloudinary(file.buffer, `${userId}/${fileType}s`, resourceType);

            const newFile = await File.create({
                userId,
                name: file.originalname,
                originalName: file.originalname,
                mimeType: file.mimetype,
                fileType,
                size: file.size,
                url: result.secure_url,
                publicId: result.public_id,
                thumbnailUrl: result.eager?.[0]?.secure_url,
                parentId: parentId || null,
            });

            uploadedFiles.push(newFile);
            totalSize += file.size;
        }

        await storageService.incrementUsage(userId, totalSize);

        return { files: uploadedFiles, totalSize };
    }

    async getFiles(userId: Types.ObjectId, type?: string, parentId?: string): Promise<IFileDocument[]> {
        const query: IFileQueryFilter = { userId };
        if (type === 'image' || type === 'pdf') query.fileType = type;
        if (parentId !== undefined) {
            query.parentId = parentId === 'null' ? null : parentId;
        }
        return File.find(query).sort({ createdAt: -1 });
    }

    async getByType(userId: Types.ObjectId, fileType: FileType, limit: number = 100): Promise<IFileDocument[]> {
        return (File as unknown as IFileModel).findByType(userId, fileType, limit);
    }

    async getById(userId: Types.ObjectId, fileId: string): Promise<IFileDocument> {
        const file = await File.findOne({ _id: fileId, userId });
        if (!file) throw ApiError.notFound('File');
        return file;
    }

    async updateName(userId: Types.ObjectId, fileId: string, name: string): Promise<IFileDocument> {
        const file = await File.findOneAndUpdate(
            { _id: fileId, userId },
            { name, updatedAt: new Date() },
            { new: true, runValidators: true }
        );
        if (!file) throw ApiError.notFound('File');
        return file;
    }

    async toggleFavorite(userId: Types.ObjectId, fileId: string): Promise<{ id: Types.ObjectId; isFavorite: boolean }> {
        const file = await File.findOne({ _id: fileId, userId });
        if (!file) throw ApiError.notFound('File');

        file.isFavorite = !file.isFavorite;
        await file.save();

        return { id: file._id, isFavorite: file.isFavorite };
    }

    async duplicate(userId: Types.ObjectId, fileId: string, user: IUserDocument): Promise<IFileDocument> {
        const originalFile = await File.findOne({ _id: fileId, userId });
        if (!originalFile) throw ApiError.notFound('File');
        if (!user.hasAvailableStorage(originalFile.size)) throw ApiError.storageQuotaExceeded();

        const duplicatedFile = await File.create({
            userId,
            name: appendCopySuffix(originalFile.name),
            originalName: originalFile.originalName,
            mimeType: originalFile.mimeType,
            fileType: originalFile.fileType,
            size: originalFile.size,
            url: originalFile.url,
            publicId: originalFile.publicId,
            thumbnailUrl: originalFile.thumbnailUrl,
            parentId: originalFile.parentId,
            isFavorite: false,
        });

        await storageService.incrementUsage(userId, originalFile.size);

        return duplicatedFile;
    }

    async copy(userId: Types.ObjectId, fileId: string, targetFolderId: string | null, user: IUserDocument): Promise<IFileDocument> {
        const originalFile = await File.findOne({ _id: fileId, userId });
        if (!originalFile) throw ApiError.notFound('File');
        if (!user.hasAvailableStorage(originalFile.size)) throw ApiError.storageQuotaExceeded();

        if (targetFolderId) {
            const targetFolder = await Folder.findOne({ _id: targetFolderId, userId });
            if (!targetFolder) throw ApiError.notFound('Target folder');
        }

        const copiedFile = await File.create({
            userId,
            name: appendCopySuffix(originalFile.name),
            originalName: originalFile.originalName,
            mimeType: originalFile.mimeType,
            fileType: originalFile.fileType,
            size: originalFile.size,
            url: originalFile.url,
            publicId: originalFile.publicId,
            thumbnailUrl: originalFile.thumbnailUrl,
            parentId: targetFolderId || null,
            isFavorite: false,
        });

        await storageService.incrementUsage(userId, originalFile.size);

        return copiedFile;
    }

    async delete(userId: Types.ObjectId, fileId: string): Promise<{ deletedFile: Types.ObjectId; freedStorage: number }> {
        const file = await File.findOne({ _id: fileId, userId });
        if (!file) throw ApiError.notFound('File');

        const resourceType = file.fileType === 'image' ? 'image' : 'raw';
        await deleteFromCloudinary(file.publicId, resourceType);
        await file.deleteOne();
        await storageService.decrementUsage(userId, file.size);

        return { deletedFile: file._id, freedStorage: file.size };
    }

    async deleteByFolderIds(userId: Types.ObjectId, folderIds: Types.ObjectId[]): Promise<number> {
        const files = await File.find({ userId, parentId: { $in: folderIds } });
        const totalSize = files.reduce((sum, file) => sum + file.size, 0);

        // TODO: Bulk delete from Cloudinary
        await File.deleteMany({ userId, parentId: { $in: folderIds } });

        if (totalSize > 0) {
            await storageService.decrementUsage(userId, totalSize);
        }

        return totalSize;
    }
}

export const fileService = new FileService();
export default FileService;
