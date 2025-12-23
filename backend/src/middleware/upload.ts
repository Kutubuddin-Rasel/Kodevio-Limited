import multer, { FileFilterCallback } from 'multer';
import { Request } from 'express';
import { ApiError } from '../utils';
import config from '../config';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
const ALLOWED_PDF_TYPES = ['application/pdf'];
const ALL_ALLOWED_TYPES = [...ALLOWED_IMAGE_TYPES, ...ALLOWED_PDF_TYPES];
const MAX_FILES = 10;

const imageFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
    if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new ApiError(400, 'Only image files are allowed (JPEG, PNG, GIF, WebP, SVG)'));
    }
};

const pdfFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
    if (ALLOWED_PDF_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new ApiError(400, 'Only PDF files are allowed'));
    }
};

const allFilesFilter = (_req: Request, file: Express.Multer.File, cb: FileFilterCallback): void => {
    if (ALL_ALLOWED_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new ApiError(400, 'Only images (JPEG, PNG, GIF, WebP, SVG) and PDFs are allowed'));
    }
};

const memoryStorage = multer.memoryStorage();

export const uploadImages = multer({
    storage: memoryStorage,
    fileFilter: imageFilter,
    limits: { fileSize: config.maxFileSize, files: MAX_FILES },
});

export const uploadPDFs = multer({
    storage: memoryStorage,
    fileFilter: pdfFilter,
    limits: { fileSize: config.maxFileSize, files: MAX_FILES },
});

export const uploadFiles = multer({
    storage: memoryStorage,
    fileFilter: allFilesFilter,
    limits: { fileSize: config.maxFileSize, files: MAX_FILES },
});

export const getFileType = (mimetype: string): 'image' | 'pdf' => {
    if (ALLOWED_IMAGE_TYPES.includes(mimetype)) return 'image';
    if (ALLOWED_PDF_TYPES.includes(mimetype)) return 'pdf';
    throw new ApiError(400, 'Unsupported file type');
};

export const getResourceType = (mimetype: string): 'image' | 'raw' => {
    if (ALLOWED_IMAGE_TYPES.includes(mimetype)) return 'image';
    return 'raw';
};

export default uploadFiles;
