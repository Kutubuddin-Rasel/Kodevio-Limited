import mongoose, { Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import { IUserDocument } from '../types';

const userSchema = new Schema<IUserDocument>(
    {
        email: {
            type: String,
            required: [true, 'Email is required'],
            unique: true,
            lowercase: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email'],
        },
        password: {
            type: String,
            required: [true, 'Password is required'],
            minlength: [6, 'Password must be at least 6 characters'],
            select: false,
        },
        googleId: {
            type: String,
            unique: true,
            sparse: true,
        },
        firstName: {
            type: String,
            required: [true, 'First name is required'],
            trim: true,
            maxlength: [50, 'First name cannot exceed 50 characters'],
        },
        lastName: {
            type: String,
            trim: true,
            maxlength: [50, 'Last name cannot exceed 50 characters'],
        },
        avatar: { type: String },
        storageLimit: {
            type: Number,
            default: 15 * 1024 * 1024 * 1024,
        },
        usedStorage: {
            type: Number,
            default: 0,
            min: [0, 'Used storage cannot be negative'],
        },
        resetPasswordOTP: { type: String, select: false },
        resetPasswordExpires: { type: Date, select: false },
        isVerified: { type: Boolean, default: false },
        isActive: { type: Boolean, default: true },
        lastLoginAt: { type: Date },
    },
    {
        timestamps: true,
        toJSON: {
            virtuals: true,
            transform: (_doc, ret) => {
                const result = ret as { [key: string]: unknown };
                delete result.password;
                delete result.resetPasswordOTP;
                delete result.resetPasswordExpires;
                delete result.__v;
                return result;
            },
        },
        toObject: { virtuals: true },
    }
);

userSchema.index({ email: 1 });
userSchema.index({ googleId: 1 }, { sparse: true });

userSchema.virtual('fullName').get(function (this: IUserDocument) {
    return this.lastName ? `${this.firstName} ${this.lastName}` : this.firstName;
});

userSchema.virtual('availableStorage').get(function (this: IUserDocument) {
    return this.storageLimit - this.usedStorage;
});

userSchema.pre('save', async function () {
    if (!this.isModified('password')) return;
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
    return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.getStoragePercentage = function (): number {
    if (this.storageLimit === 0) return 100;
    return Math.round((this.usedStorage / this.storageLimit) * 100);
};

userSchema.methods.hasAvailableStorage = function (requiredBytes: number): boolean {
    return this.usedStorage + requiredBytes <= this.storageLimit;
};

interface IUserModel extends Model<IUserDocument> {
    findByEmail(email: string): Promise<IUserDocument | null>;
    findByGoogleId(googleId: string): Promise<IUserDocument | null>;
}

userSchema.statics.findByEmail = function (email: string): Promise<IUserDocument | null> {
    return this.findOne({ email: email.toLowerCase(), isActive: true });
};

userSchema.statics.findByGoogleId = function (googleId: string): Promise<IUserDocument | null> {
    return this.findOne({ googleId, isActive: true });
};

const User = mongoose.model<IUserDocument, IUserModel>('User', userSchema);

export default User;
