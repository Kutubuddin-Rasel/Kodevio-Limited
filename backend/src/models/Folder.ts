import mongoose, { Schema, Model, Types } from 'mongoose';
import { IFolderDocument } from '../types';

const folderSchema = new Schema<IFolderDocument>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
        },
        name: {
            type: String,
            required: [true, 'Folder name is required'],
            trim: true,
            maxlength: [255, 'Folder name cannot exceed 255 characters'],
        },
        parentId: {
            type: Schema.Types.ObjectId,
            ref: 'Folder',
            default: null,
        },
        isFavorite: { type: Boolean, default: false },
        color: {
            type: String,
            match: [/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format'],
        },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: (_doc, ret) => {
                const result = ret as { [key: string]: unknown };
                result.entityType = 'folder';
                delete result.__v;
                return result;
            },
        },
        toObject: { virtuals: true },
    }
);

folderSchema.index({ userId: 1, parentId: 1 });
folderSchema.index({ userId: 1, isFavorite: 1 });
folderSchema.index({ userId: 1, createdAt: -1 });
folderSchema.index({ userId: 1, name: 'text' });

folderSchema.virtual('isRoot').get(function (this: IFolderDocument) {
    return this.parentId === null;
});

interface IFolderModel extends Model<IFolderDocument> {
    findByUserAndParent(userId: Types.ObjectId, parentId: Types.ObjectId | null): Promise<IFolderDocument[]>;
    findFavorites(userId: Types.ObjectId): Promise<IFolderDocument[]>;
    findRecent(userId: Types.ObjectId, limit?: number): Promise<IFolderDocument[]>;
    getAncestors(folderId: Types.ObjectId): Promise<IFolderDocument[]>;
}

folderSchema.statics.findByUserAndParent = function (
    userId: Types.ObjectId,
    parentId: Types.ObjectId | null
): Promise<IFolderDocument[]> {
    return this.find({ userId, parentId }).sort({ name: 1 });
};

folderSchema.statics.findFavorites = function (userId: Types.ObjectId): Promise<IFolderDocument[]> {
    return this.find({ userId, isFavorite: true }).sort({ updatedAt: -1 });
};

folderSchema.statics.findRecent = function (userId: Types.ObjectId, limit: number = 50): Promise<IFolderDocument[]> {
    return this.find({ userId }).sort({ createdAt: -1 }).limit(limit);
};

folderSchema.statics.getAncestors = async function (folderId: Types.ObjectId): Promise<IFolderDocument[]> {
    const ancestors: IFolderDocument[] = [];
    let currentFolder = await this.findById(folderId);

    while (currentFolder && currentFolder.parentId) {
        currentFolder = await this.findById(currentFolder.parentId);
        if (currentFolder) ancestors.unshift(currentFolder);
    }

    return ancestors;
};

folderSchema.methods.getChildren = async function (): Promise<IFolderDocument[]> {
    return mongoose.model('Folder').find({ parentId: this._id });
};

folderSchema.methods.getAllDescendantIds = async function (): Promise<Types.ObjectId[]> {
    const Folder = mongoose.model('Folder');
    const descendantIds: Types.ObjectId[] = [];

    const collectDescendants = async (parentId: Types.ObjectId) => {
        const children = await Folder.find({ parentId }).select('_id');
        for (const child of children) {
            descendantIds.push(child._id);
            await collectDescendants(child._id);
        }
    };

    await collectDescendants(this._id);
    return descendantIds;
};

const Folder = mongoose.model<IFolderDocument, IFolderModel>('Folder', folderSchema);

export default Folder;
