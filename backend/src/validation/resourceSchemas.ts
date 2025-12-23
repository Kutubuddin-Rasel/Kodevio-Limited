import { z } from 'zod';

const mongoIdOptional = z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid folder ID').optional().nullable();
const colorHex = z.string().regex(/^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$/, 'Invalid color format').optional();

export const uploadFileSchema = z.object({
    parentId: mongoIdOptional,
});

export const updateFileSchema = z.object({
    name: z.string().trim().min(1, 'File name is required').max(255, 'File name cannot exceed 255 characters'),
});

export const copyFileSchema = z.object({
    targetFolderId: mongoIdOptional,
});

export const createFolderSchema = z.object({
    name: z.string().trim().min(1, 'Folder name is required').max(255, 'Folder name cannot exceed 255 characters'),
    parentId: mongoIdOptional,
    color: colorHex,
});

export const updateFolderSchema = z.object({
    name: z.string().trim().min(1, 'Folder name cannot be empty').max(255, 'Folder name cannot exceed 255 characters').optional(),
    color: colorHex,
});

export const createNoteSchema = z.object({
    title: z.string().trim().min(1, 'Note title is required').max(255, 'Note title cannot exceed 255 characters'),
    content: z.string().max(100000, 'Note content cannot exceed 100,000 characters').optional(),
    parentId: mongoIdOptional,
    color: colorHex,
});

export const updateNoteSchema = z.object({
    title: z.string().trim().min(1, 'Note title cannot be empty').max(255, 'Note title cannot exceed 255 characters').optional(),
    content: z.string().max(100000, 'Note content cannot exceed 100,000 characters').optional(),
    color: colorHex,
});

export const mongoIdParamSchema = z.object({
    id: z.string().regex(/^[a-fA-F0-9]{24}$/, 'Invalid ID format'),
});

export type UploadFileInput = z.infer<typeof uploadFileSchema>;
export type UpdateFileInput = z.infer<typeof updateFileSchema>;
export type CopyFileInput = z.infer<typeof copyFileSchema>;
export type CreateFolderInput = z.infer<typeof createFolderSchema>;
export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;
export type CreateNoteInput = z.infer<typeof createNoteSchema>;
export type UpdateNoteInput = z.infer<typeof updateNoteSchema>;
