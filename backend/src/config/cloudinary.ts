import { v2 as cloudinary, UploadApiResponse, UploadApiErrorResponse } from 'cloudinary';
import config from './index';

cloudinary.config({
    cloud_name: config.cloudinary.cloudName,
    api_key: config.cloudinary.apiKey,
    api_secret: config.cloudinary.apiSecret,
    secure: true,
});

export const uploadToCloudinary = async (
    filePath: string,
    folder: string,
    resourceType: 'image' | 'raw' = 'image'
): Promise<UploadApiResponse> => {
    return new Promise((resolve, reject) => {
        cloudinary.uploader.upload(
            filePath,
            {
                folder: `jotter/${folder}`,
                resource_type: resourceType,
                ...(resourceType === 'image' && {
                    eager: [{ width: 200, height: 200, crop: 'thumb', gravity: 'auto' }],
                }),
            },
            (error: UploadApiErrorResponse | undefined, result: UploadApiResponse | undefined) => {
                if (error || !result) {
                    reject(error || new Error('Upload failed'));
                } else {
                    resolve(result);
                }
            }
        );
    });
};

export const uploadBufferToCloudinary = async (
    buffer: Buffer,
    folder: string,
    resourceType: 'image' | 'raw' = 'image'
): Promise<UploadApiResponse> => {
    return new Promise((resolve, reject) => {
        const uploadStream = cloudinary.uploader.upload_stream(
            {
                folder: `jotter/${folder}`,
                resource_type: resourceType,
                ...(resourceType === 'image' && {
                    eager: [{ width: 200, height: 200, crop: 'thumb', gravity: 'auto' }],
                }),
            },
            (error, result) => {
                if (error || !result) {
                    reject(error || new Error('Upload failed'));
                } else {
                    resolve(result);
                }
            }
        );
        uploadStream.end(buffer);
    });
};

export const deleteFromCloudinary = async (
    publicId: string,
    resourceType: 'image' | 'raw' = 'image'
): Promise<{ result: string }> => {
    return cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
};

export const deleteMultipleFromCloudinary = async (
    publicIds: string[],
    resourceType: 'image' | 'raw' = 'image'
): Promise<{ deleted: Record<string, string> }> => {
    return cloudinary.api.delete_resources(publicIds, { resource_type: resourceType });
};

export const getOptimizedUrl = (
    publicId: string,
    options: { width?: number; height?: number; quality?: string } = {}
): string => {
    return cloudinary.url(publicId, {
        width: options.width,
        height: options.height,
        crop: 'fill',
        quality: options.quality || 'auto',
        fetch_format: 'auto',
        secure: true,
    });
};

export const getThumbnailUrl = (publicId: string, size: number = 200): string => {
    return cloudinary.url(publicId, {
        width: size,
        height: size,
        crop: 'thumb',
        gravity: 'auto',
        quality: 'auto',
        fetch_format: 'auto',
        secure: true,
    });
};

export { cloudinary };
export default cloudinary;
