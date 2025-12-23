import { Document, Types, Model } from 'mongoose';

export interface ITimestamps {
    createdAt: Date;
    updatedAt: Date;
}

export interface IUserAddress {
    street?: string;
    city?: string;
    state?: string;
    zipCode?: string;
    country?: string;
}

export interface IUser {
    email: string;
    password: string;
    googleId?: string;
    firstName: string;
    lastName?: string;
    avatar?: string;
    storageLimit: number;
    usedStorage: number;
    resetPasswordOTP?: string;
    resetPasswordExpires?: Date;
    isVerified: boolean;
    isActive: boolean;
    lastLoginAt?: Date;
}

export interface IUserDocument extends IUser, ITimestamps, Document {
    _id: Types.ObjectId;
    comparePassword(candidatePassword: string): Promise<boolean>;
    getStoragePercentage(): number;
    hasAvailableStorage(requiredBytes: number): boolean;
}

export interface IFolder {
    userId: Types.ObjectId;
    name: string;
    parentId: Types.ObjectId | null;
    isFavorite: boolean;
    color?: string;
}

export interface IFolderDocument extends IFolder, ITimestamps, Document {
    _id: Types.ObjectId;
    getAllDescendantIds(): Promise<Types.ObjectId[]>;
}

export interface IFolderModel extends Model<IFolderDocument> {
    getAncestors(folderId: Types.ObjectId): Promise<IFolderDocument[]>;
}

export type FileType = 'image' | 'pdf';

export interface IFile {
    userId: Types.ObjectId;
    name: string;
    originalName: string;
    mimeType: string;
    fileType: FileType;
    size: number;
    url: string;
    publicId: string;
    thumbnailUrl?: string;
    parentId: Types.ObjectId | null;
    isFavorite: boolean;
}

export interface IFileDocument extends IFile, ITimestamps, Document {
    _id: Types.ObjectId;
    getSizeInMB(): number;
    getSizeFormatted(): string;
}

export interface IStorageByType {
    images: { count: number; size: number };
    pdfs: { count: number; size: number };
}

export interface IFileModel extends Model<IFileDocument> {
    findByType(userId: Types.ObjectId, type: FileType, limit?: number): Promise<IFileDocument[]>;
    calculateStorageByType(userId: Types.ObjectId): Promise<IStorageByType>;
}

export interface INote {
    userId: Types.ObjectId;
    title: string;
    content: string;
    parentId: Types.ObjectId | null;
    isFavorite: boolean;
    color?: string;
}

export interface INoteDocument extends INote, ITimestamps, Document {
    _id: Types.ObjectId;
}

export interface IFileQueryFilter {
    userId: Types.ObjectId;
    fileType?: FileType;
    parentId?: Types.ObjectId | string | null;
}

export interface IFolderQueryFilter {
    userId: Types.ObjectId;
    parentId?: Types.ObjectId | null;
    isFavorite?: boolean;
}

export interface INoteQueryFilter {
    userId: Types.ObjectId;
    parentId?: Types.ObjectId | string | null;
    isFavorite?: boolean;
}

export interface IDateRangeFilter {
    $gte: Date;
    $lte: Date;
}

export interface IEntityQueryFilter {
    userId: Types.ObjectId;
    createdAt?: IDateRangeFilter;
    isFavorite?: boolean;
    name?: RegExp;
}

export interface IAggregationDayCount {
    _id: number;
    count: number;
}

export interface IDaysWithItems {
    [day: number]: {
        folders: number;
        files: number;
        notes: number;
        total: number;
    };
}

export interface IStorageStats {
    total: number;
    used: number;
    available: number;
    percentage: number;
}

export interface IStorageBreakdown {
    folders: { count: number };
    notes: { count: number };
    images: { count: number; size: number };
    pdfs: { count: number; size: number };
}

export interface IDashboardStats extends IStorageStats {
    breakdown: IStorageBreakdown;
}

export type EntityType = 'folder' | 'file' | 'note';

export interface IEntityBase {
    _id: Types.ObjectId;
    entityType: EntityType;
    name: string;
    isFavorite: boolean;
    parentId: Types.ObjectId | null;
    createdAt: Date;
    updatedAt: Date;
}

export interface IFolderEntity extends IEntityBase {
    entityType: 'folder';
    color?: string;
}

export interface IFileEntity extends IEntityBase {
    entityType: 'file';
    fileType: FileType;
    size: number;
    url: string;
    thumbnailUrl?: string;
}

export interface INoteEntity extends IEntityBase {
    entityType: 'note';
    title: string;
    content: string;
    color?: string;
}

export type MixedEntity = IFolderEntity | IFileEntity | INoteEntity;

export interface ICreateFolderRequest {
    name: string;
    parentId?: string | null;
    color?: string;
}

export interface IUploadFileRequest {
    parentId?: string | null;
}

export interface ICreateNoteRequest {
    title: string;
    content?: string;
    parentId?: string | null;
    color?: string;
}

export interface ICopyRequest {
    targetFolderId: string | null;
}

export interface ICalendarQuery {
    date: string;
}

export interface ISearchQuery {
    q: string;
    type?: EntityType | 'image' | 'pdf';
}

export interface IRegisterRequest {
    email: string;
    password: string;
    firstName: string;
    lastName?: string;
}

export interface ILoginRequest {
    email: string;
    password: string;
}

export interface IForgotPasswordRequest {
    email: string;
}

export interface IVerifyOTPRequest {
    email: string;
    otp: string;
}

export interface IResetPasswordRequest {
    email: string;
    otp: string;
    newPassword: string;
}

export interface IChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export interface IAuthPayload {
    userId: string;
    email: string;
}

export interface ITokenResponse {
    token: string;
    expiresIn: string;
}
