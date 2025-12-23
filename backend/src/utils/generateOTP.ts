import crypto from 'crypto';

export const generateOTP = (length: number = 6): string => {
    const digits = '0123456789';
    let otp = '';

    for (let i = 0; i < length; i++) {
        otp += digits[crypto.randomInt(0, digits.length)];
    }

    return otp;
};

export const generateOTPWithExpiry = (
    length: number = 6,
    expiryMinutes: number = 10
): { otp: string; expiresAt: Date } => {
    const otp = generateOTP(length);
    const expiresAt = new Date(Date.now() + expiryMinutes * 60 * 1000);

    return { otp, expiresAt };
};

export const isOTPExpired = (expiresAt: Date): boolean => {
    return new Date() > expiresAt;
};
