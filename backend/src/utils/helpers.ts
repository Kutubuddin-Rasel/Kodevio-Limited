export const formatBytes = (bytes: number, decimals: number = 2): string => {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
};

export const parseSize = (sizeString: string): number => {
    const units: Record<string, number> = {
        B: 1,
        KB: 1024,
        MB: 1024 * 1024,
        GB: 1024 * 1024 * 1024,
        TB: 1024 * 1024 * 1024 * 1024,
    };

    const match = sizeString.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB|TB)$/i);
    if (!match) throw new Error('Invalid size format');

    const value = parseFloat(match[1]);
    const unit = match[2].toUpperCase();

    return Math.floor(value * units[unit]);
};

export const calculateStoragePercentage = (used: number, total: number): number => {
    if (total === 0) return 100;
    return Math.round((used / total) * 100 * 100) / 100;
};

export const generateUniqueFilename = (originalName: string): string => {
    const timestamp = Date.now();
    const ext = originalName.split('.').pop();
    const baseName = originalName.replace(/\.[^/.]+$/, '');
    const sanitized = baseName.replace(/[^a-zA-Z0-9-_]/g, '_');

    return `${sanitized}_${timestamp}.${ext}`;
};

export const appendCopySuffix = (name: string, suffix: string = 'Copy'): string => {
    const lastDotIndex = name.lastIndexOf('.');

    if (lastDotIndex === -1) {
        return `${name} (${suffix})`;
    }

    const baseName = name.substring(0, lastDotIndex);
    const extension = name.substring(lastDotIndex);

    return `${baseName} (${suffix})${extension}`;
};

export const getDateRange = (dateString: string): { startOfDay: Date; endOfDay: Date } => {
    const date = new Date(dateString);

    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    return { startOfDay, endOfDay };
};

export const isValidObjectId = (id: string): boolean => {
    return /^[a-fA-F0-9]{24}$/.test(id);
};
