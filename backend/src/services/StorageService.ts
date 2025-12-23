import { User } from '../models';
import { Types } from 'mongoose';

class StorageService {
    async incrementUsage(userId: Types.ObjectId | string, bytes: number): Promise<void> {
        if (bytes <= 0) return;
        await User.findByIdAndUpdate(userId, { $inc: { usedStorage: bytes } });
    }

    async decrementUsage(userId: Types.ObjectId | string, bytes: number): Promise<void> {
        if (bytes <= 0) return;
        await User.findByIdAndUpdate(userId, { $inc: { usedStorage: -bytes } });
    }

    async setUsage(userId: Types.ObjectId | string, bytes: number): Promise<void> {
        await User.findByIdAndUpdate(userId, { usedStorage: Math.max(0, bytes) });
    }

    async recalculateUsage(userId: Types.ObjectId | string): Promise<number> {
        const { File } = await import('../models');
        const result = await File.aggregate([
            { $match: { userId: new Types.ObjectId(userId.toString()) } },
            { $group: { _id: null, totalSize: { $sum: '$size' } } },
        ]);
        const totalSize = result.length > 0 ? result[0].totalSize : 0;
        await this.setUsage(userId, totalSize);
        return totalSize;
    }
}

export const storageService = new StorageService();
export default StorageService;
