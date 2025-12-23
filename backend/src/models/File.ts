import mongoose, { Schema, Model, Types } from 'mongoose';
import { IFileDocument, FileType } from '../types';

const fileSchema = new Schema<IFileDocument>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
        },
        name: {
            type: String,
            required: [true, 'File name is required'],
            trim: true,
            maxlength: [255, 'File name cannot exceed 255 characters'],
        },
        originalName: {
            type: String,
            required: [true, 'Original file name is required'],
            trim: true,
        },
        mimeType: {
            type: String,
            required: [true, 'MIME type is required'],
        },
        fileType: {
            type: String,
            enum: {
                values: ['image', 'pdf'] as FileType[],
                message: 'File type must be either "image" or "pdf"',
            },
            required: [true, 'File type is required'],
        },
        size: {
            type: Number,
            required: [true, 'File size is required'],
            min: [0, 'File size cannot be negative'],
        },
        url: {
            type: String,
            required: [true, 'File URL is required'],
        },
        publicId: {
            type: String,
            required: [true, 'Cloudinary public ID is required'],
        },
        thumbnailUrl: { type: String },
        parentId: {
            type: Schema.Types.ObjectId,
            ref: 'Folder',
            default: null,
        },
        isFavorite: { type: Boolean, default: false },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: (_doc, ret) => {
                const result = ret as { [key: string]: unknown };
                result.entityType = 'file';
                delete result.__v;
                return result;
            },
        },
        toObject: { virtuals: true },
    }
);

fileSchema.index({ userId: 1, fileType: 1 });
fileSchema.index({ userId: 1, parentId: 1 });
fileSchema.index({ userId: 1, isFavorite: 1 });
fileSchema.index({ userId: 1, createdAt: -1 });
fileSchema.index({ userId: 1, name: 'text' });

fileSchema.virtual('isRoot').get(function (this: IFileDocument) {
    return this.parentId === null;
});

fileSchema.virtual('isImage').get(function (this: IFileDocument) {
    return this.fileType === 'image';
});

fileSchema.virtual('isPdf').get(function (this: IFileDocument) {
    return this.fileType === 'pdf';
});

fileSchema.methods.getSizeInMB = function (): number {
    return this.size / (1024 * 1024);
};

fileSchema.methods.getSizeFormatted = function (): string {
    const bytes = this.size;
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
};

interface IFileModel extends Model<IFileDocument> {
    findByUserAndParent(userId: Types.ObjectId, parentId: Types.ObjectId | null): Promise<IFileDocument[]>;
    findByType(userId: Types.ObjectId, fileType: FileType, limit?: number): Promise<IFileDocument[]>;
    findFavorites(userId: Types.ObjectId): Promise<IFileDocument[]>;
    findRecent(userId: Types.ObjectId, limit?: number): Promise<IFileDocument[]>;
    calculateStorageByType(userId: Types.ObjectId): Promise<{ images: { count: number; size: number }; pdfs: { count: number; size: number } }>;
    calculateTotalStorage(userId: Types.ObjectId): Promise<number>;
    calculateStorageInFolders(userId: Types.ObjectId): Promise<number>;
}

fileSchema.statics.findByUserAndParent = function (
    userId: Types.ObjectId,
    parentId: Types.ObjectId | null
): Promise<IFileDocument[]> {
    return this.find({ userId, parentId }).sort({ name: 1 });
};

fileSchema.statics.findByType = function (
    userId: Types.ObjectId,
    fileType: FileType,
    limit: number = 100
): Promise<IFileDocument[]> {
    return this.find({ userId, fileType }).sort({ createdAt: -1 }).limit(limit);
};

fileSchema.statics.findFavorites = function (userId: Types.ObjectId): Promise<IFileDocument[]> {
    return this.find({ userId, isFavorite: true }).sort({ updatedAt: -1 });
};

fileSchema.statics.findRecent = function (userId: Types.ObjectId, limit: number = 50): Promise<IFileDocument[]> {
    return this.find({ userId }).sort({ createdAt: -1 }).limit(limit);
};

fileSchema.statics.calculateStorageByType = async function (
    userId: Types.ObjectId
): Promise<{ images: { count: number; size: number }; pdfs: { count: number; size: number } }> {
    const result = await this.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: '$fileType', totalSize: { $sum: '$size' }, count: { $sum: 1 } } },
    ]);

    const breakdown = { images: { count: 0, size: 0 }, pdfs: { count: 0, size: 0 } };
    for (const item of result) {
        if (item._id === 'image') breakdown.images = { count: item.count, size: item.totalSize };
        else if (item._id === 'pdf') breakdown.pdfs = { count: item.count, size: item.totalSize };
    }
    return breakdown;
};

fileSchema.statics.calculateTotalStorage = async function (userId: Types.ObjectId): Promise<number> {
    const result = await this.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        { $group: { _id: null, totalSize: { $sum: '$size' } } },
    ]);
    return result.length > 0 ? result[0].totalSize : 0;
};

fileSchema.statics.calculateStorageInFolders = async function (userId: Types.ObjectId): Promise<number> {
    const result = await this.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId), parentId: { $ne: null } } },
        { $group: { _id: null, totalSize: { $sum: '$size' } } },
    ]);
    return result.length > 0 ? result[0].totalSize : 0;
};

const File = mongoose.model<IFileDocument, IFileModel>('File', fileSchema);

export default File;
