import { Request, Response } from 'express';
import { Note, Folder } from '../models';
import { ApiError, ApiResponse, asyncHandler, appendCopySuffix } from '../utils';
import { ICreateNoteRequest, ICopyRequest, IUserDocument, INoteQueryFilter } from '../types';

export const createNote = asyncHandler(async (req: Request, res: Response) => {
    const { title, content, parentId, color } = req.body as ICreateNoteRequest;
    const user = req.user as IUserDocument;
    const userId = user._id;

    if (parentId) {
        const parentFolder = await Folder.findOne({ _id: parentId, userId });
        if (!parentFolder) throw ApiError.notFound('Parent folder');
    }

    const note = await Note.create({
        userId,
        title,
        content: content || '',
        parentId: parentId || null,
        color,
    });

    ApiResponse.created(res, note, 'Note created successfully');
});

export const getNotes = asyncHandler(async (req: Request, res: Response) => {
    const user = req.user as IUserDocument;
    const { parentId } = req.query;

    const query: INoteQueryFilter = { userId: user._id };
    if (parentId !== undefined) {
        const parentIdStr = parentId as string;
        query.parentId = parentIdStr === 'null' ? null : parentIdStr;
    }

    const notes = await Note.find(query).sort({ updatedAt: -1 });
    ApiResponse.success(res, notes, 'Notes retrieved successfully');
});

export const getNoteById = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = req.user as IUserDocument;

    const note = await Note.findOne({ _id: id, userId: user._id });
    if (!note) throw ApiError.notFound('Note');

    ApiResponse.success(res, note, 'Note retrieved successfully');
});

export const updateNote = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { title, content, color } = req.body;
    const user = req.user as IUserDocument;

    const updateData: Partial<{ title: string; content: string; color: string; updatedAt: Date }> = { updatedAt: new Date() };
    if (title !== undefined) updateData.title = title;
    if (content !== undefined) updateData.content = content;
    if (color !== undefined) updateData.color = color;

    const note = await Note.findOneAndUpdate({ _id: id, userId: user._id }, updateData, { new: true, runValidators: true });
    if (!note) throw ApiError.notFound('Note');

    ApiResponse.success(res, note, 'Note updated successfully');
});

export const toggleFavorite = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = req.user as IUserDocument;

    const note = await Note.findOne({ _id: id, userId: user._id });
    if (!note) throw ApiError.notFound('Note');

    note.isFavorite = !note.isFavorite;
    await note.save();

    ApiResponse.success(res, { id: note._id, isFavorite: note.isFavorite }, `Note ${note.isFavorite ? 'added to' : 'removed from'} favorites`);
});

export const duplicateNote = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = req.user as IUserDocument;

    const originalNote = await Note.findOne({ _id: id, userId: user._id });
    if (!originalNote) throw ApiError.notFound('Note');

    const duplicatedNote = await Note.create({
        userId: user._id,
        title: appendCopySuffix(originalNote.title),
        content: originalNote.content,
        parentId: originalNote.parentId,
        color: originalNote.color,
        isFavorite: false,
    });

    ApiResponse.created(res, duplicatedNote, 'Note duplicated successfully');
});

export const copyNote = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const { targetFolderId } = req.body as ICopyRequest;
    const user = req.user as IUserDocument;

    const originalNote = await Note.findOne({ _id: id, userId: user._id });
    if (!originalNote) throw ApiError.notFound('Note');

    if (targetFolderId) {
        const targetFolder = await Folder.findOne({ _id: targetFolderId, userId: user._id });
        if (!targetFolder) throw ApiError.notFound('Target folder');
    }

    const copiedNote = await Note.create({
        userId: user._id,
        title: appendCopySuffix(originalNote.title),
        content: originalNote.content,
        parentId: targetFolderId || null,
        color: originalNote.color,
        isFavorite: false,
    });

    ApiResponse.created(res, copiedNote, 'Note copied successfully');
});

export const deleteNote = asyncHandler(async (req: Request, res: Response) => {
    const { id } = req.params;
    const user = req.user as IUserDocument;

    const note = await Note.findOneAndDelete({ _id: id, userId: user._id });
    if (!note) throw ApiError.notFound('Note');

    ApiResponse.success(res, { deletedNote: note._id }, 'Note deleted successfully');
});
