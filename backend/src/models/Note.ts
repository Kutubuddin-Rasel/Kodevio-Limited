import mongoose, { Schema, Model, Types } from 'mongoose';
import { INoteDocument } from '../types';

const noteSchema = new Schema<INoteDocument>(
    {
        userId: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: [true, 'User ID is required'],
            index: true,
        },
        title: {
            type: String,
            required: [true, 'Note title is required'],
            trim: true,
            maxlength: [255, 'Note title cannot exceed 255 characters'],
        },
        content: {
            type: String,
            default: '',
            maxlength: [100000, 'Note content cannot exceed 100,000 characters'],
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
                result.entityType = 'note';
                delete result.__v;
                return result;
            },
        },
        toObject: { virtuals: true },
    }
);

noteSchema.index({ userId: 1, parentId: 1 });
noteSchema.index({ userId: 1, isFavorite: 1 });
noteSchema.index({ userId: 1, createdAt: -1 });
noteSchema.index({ userId: 1, title: 'text', content: 'text' });

noteSchema.virtual('isRoot').get(function (this: INoteDocument) {
    return this.parentId === null;
});

noteSchema.virtual('preview').get(function (this: INoteDocument) {
    if (!this.content) return '';
    return this.content.length > 100 ? this.content.substring(0, 100) + '...' : this.content;
});

noteSchema.virtual('wordCount').get(function (this: INoteDocument) {
    if (!this.content) return 0;
    return this.content.split(/\s+/).filter(Boolean).length;
});

interface INoteModel extends Model<INoteDocument> {
    findByUserAndParent(userId: Types.ObjectId, parentId: Types.ObjectId | null): Promise<INoteDocument[]>;
    findFavorites(userId: Types.ObjectId): Promise<INoteDocument[]>;
    findRecent(userId: Types.ObjectId, limit?: number): Promise<INoteDocument[]>;
    searchNotes(userId: Types.ObjectId, query: string): Promise<INoteDocument[]>;
    countByUser(userId: Types.ObjectId): Promise<number>;
    calculateTotalContentSize(userId: Types.ObjectId): Promise<{ count: number; size: number }>;
}

noteSchema.statics.findByUserAndParent = function (
    userId: Types.ObjectId,
    parentId: Types.ObjectId | null
): Promise<INoteDocument[]> {
    return this.find({ userId, parentId }).sort({ updatedAt: -1 });
};

noteSchema.statics.findFavorites = function (userId: Types.ObjectId): Promise<INoteDocument[]> {
    return this.find({ userId, isFavorite: true }).sort({ updatedAt: -1 });
};

noteSchema.statics.findRecent = function (userId: Types.ObjectId, limit: number = 50): Promise<INoteDocument[]> {
    return this.find({ userId }).sort({ createdAt: -1 }).limit(limit);
};

noteSchema.statics.searchNotes = function (userId: Types.ObjectId, query: string): Promise<INoteDocument[]> {
    return this.find({ userId, $text: { $search: query } }).sort({ score: { $meta: 'textScore' } });
};

noteSchema.statics.countByUser = function (userId: Types.ObjectId): Promise<number> {
    return this.countDocuments({ userId });
};

noteSchema.statics.calculateTotalContentSize = async function (
    userId: Types.ObjectId
): Promise<{ count: number; size: number }> {
    const result = await this.aggregate([
        { $match: { userId: new mongoose.Types.ObjectId(userId) } },
        {
            $group: {
                _id: null,
                count: { $sum: 1 },
                totalSize: { $sum: { $strLenBytes: { $ifNull: ['$content', ''] } } },
            },
        },
    ]);
    return result.length > 0 ? { count: result[0].count, size: result[0].totalSize } : { count: 0, size: 0 };
};

const Note = mongoose.model<INoteDocument, INoteModel>('Note', noteSchema);

export default Note;
