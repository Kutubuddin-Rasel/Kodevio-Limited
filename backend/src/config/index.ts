import { logger } from '../utils/logger';

export interface IConfig {
    env: string;
    port: number;
    mongodbUri: string;
    logLevel: string;
    jwt: {
        secret: string;
        refreshSecret: string;
        expiresIn: string;
        refreshExpiresIn: string;
    };
    cloudinary: {
        cloudName: string;
        apiKey: string;
        apiSecret: string;
    };
    email: {
        apiKey: string;
        from: string;
    };
    google: {
        clientId: string;
        clientSecret: string;
        callbackUrl: string;
    };
    frontendUrl: string;
    storageLimit: number;
    maxFileSize: number;
    requestBodyLimit: string;
    rateLimit: {
        windowMs: number;
        authMax: number;
        apiMax: number;
        uploadMax: number;
    };
}

const config: IConfig = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    mongodbUri: process.env.MONGODB_URI || 'mongodb://localhost:27017/jotter_db',
    logLevel: process.env.LOG_LEVEL || 'info',

    jwt: {
        secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-token-secret-key',
        expiresIn: process.env.JWT_EXPIRES_IN || '15m',
        refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
    },

    cloudinary: {
        cloudName: process.env.CLOUDINARY_CLOUD_NAME || '',
        apiKey: process.env.CLOUDINARY_API_KEY || '',
        apiSecret: process.env.CLOUDINARY_API_SECRET || '',
    },

    email: {
        apiKey: process.env.RESEND_API_KEY || '',
        from: process.env.EMAIL_FROM || 'onboarding@resend.dev',
    },

    google: {
        clientId: process.env.GOOGLE_CLIENT_ID || '',
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || '',
        callbackUrl: process.env.GOOGLE_CALLBACK_URL || 'http://localhost:5000/api/auth/google/callback',
    },

    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
    storageLimit: parseInt(process.env.STORAGE_LIMIT || String(15 * 1024 * 1024 * 1024), 10),
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || String(50 * 1024 * 1024), 10),
    requestBodyLimit: process.env.REQUEST_BODY_LIMIT || '10mb',

    rateLimit: {
        windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || String(15 * 60 * 1000), 10),
        authMax: parseInt(process.env.AUTH_RATE_LIMIT_MAX || '5', 10),
        apiMax: parseInt(process.env.API_RATE_LIMIT_MAX || '100', 10),
        uploadMax: parseInt(process.env.UPLOAD_RATE_LIMIT_MAX || '50', 10),
    },
};

export const validateConfig = (): void => {
    const required: (keyof IConfig | string)[] = ['mongodbUri', 'jwt.secret'];
    const missing: string[] = [];

    for (const key of required) {
        if (key.includes('.')) {
            const [parent, child] = key.split('.');
            const parentObj = config[parent as keyof IConfig];
            if (typeof parentObj === 'object' && parentObj !== null && !(child in parentObj)) {
                missing.push(key);
            }
        } else if (!config[key as keyof IConfig]) {
            missing.push(key);
        }
    }

    if (missing.length > 0) {
        throw new Error(`Missing required configuration: ${missing.join(', ')}`);
    }

    if (config.env === 'production' && !config.cloudinary.cloudName) {
        logger.warn('Cloudinary configuration is missing. File uploads will fail.');
    }
};

export default config;
