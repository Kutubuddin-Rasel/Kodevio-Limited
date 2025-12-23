import { Request, Response } from 'express';
import { User, Folder, File, Note } from '../models';
import { ApiError, ApiResponse, asyncHandler } from '../utils';
import { IChangePasswordRequest, IUserDocument } from '../types';
import { uploadBufferToCloudinary, deleteFromCloudinary } from '../config/cloudinary';

export const getProfile = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUserDocument;

    ApiResponse.success(res, {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
        storageLimit: user.storageLimit,
        usedStorage: user.usedStorage,
        storagePercentage: user.getStoragePercentage(),
        isVerified: user.isVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
    }, 'Profile retrieved successfully');
});

export const updateProfile = asyncHandler(async (req: Request, res: Response) => {
    const { firstName, lastName, avatar } = req.body;
    const user = req.user as IUserDocument;

    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (avatar !== undefined) user.avatar = avatar;

    await user.save();

    ApiResponse.success(res, {
        id: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        avatar: user.avatar,
    }, 'Profile updated successfully');
});

export const uploadAvatar = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUserDocument;
    const file = req.file;

    if (!file) throw ApiError.badRequest('No image file provided');

    const oldAvatarUrl = user.avatar;
    let oldPublicId: string | null = null;

    if (oldAvatarUrl && oldAvatarUrl.includes('cloudinary')) {
        const match = oldAvatarUrl.match(/jotter\/avatars\/[^/]+\/([^.]+)/);
        if (match) {
            oldPublicId = `jotter/avatars/${user._id}/${match[1]}`;
        }
    }

    const result = await uploadBufferToCloudinary(file.buffer, `avatars/${user._id}`, 'image');

    user.avatar = result.secure_url;
    await user.save();

    if (oldPublicId) {
        deleteFromCloudinary(oldPublicId, 'image').catch(() => { });
    }

    ApiResponse.success(res, { avatar: user.avatar }, 'Avatar uploaded successfully');
});

export const deleteAvatar = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUserDocument;

    if (!user.avatar) throw ApiError.badRequest('No avatar to delete');

    if (user.avatar.includes('cloudinary')) {
        const match = user.avatar.match(/jotter\/avatars\/[^/]+\/([^.]+)/);
        if (match) {
            const publicId = `jotter/avatars/${user._id}/${match[1]}`;
            await deleteFromCloudinary(publicId, 'image');
        }
    }

    user.avatar = undefined;
    await user.save();

    ApiResponse.success(res, null, 'Avatar deleted successfully');
});

export const changePassword = asyncHandler(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body as IChangePasswordRequest;
    const currentUser = req.user as IUserDocument;

    const user = await User.findById(currentUser._id).select('+password');
    if (!user) throw ApiError.notFound('User');

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) throw ApiError.badRequest('Current password is incorrect');

    user.password = newPassword;
    await user.save();

    ApiResponse.success(res, null, 'Password changed successfully');
});

export const deleteAccount = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUserDocument;
    const userId = user._id;

    await Promise.all([
        Folder.deleteMany({ userId }),
        File.deleteMany({ userId }),
        Note.deleteMany({ userId }),
        User.findByIdAndDelete(userId),
    ]);

    ApiResponse.success(res, null, 'Account deleted successfully');
});
