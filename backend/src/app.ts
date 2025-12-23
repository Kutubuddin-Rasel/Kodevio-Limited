import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import config from './config';
import { errorHandler, notFoundHandler, sanitizeBody, apiLimiter } from './middleware';

import authRoutes from './routes/authRoutes';
import userRoutes from './routes/userRoutes';
import folderRoutes from './routes/folderRoutes';
import fileRoutes from './routes/fileRoutes';
import noteRoutes from './routes/noteRoutes';
import storageRoutes from './routes/storageRoutes';
import recentRoutes from './routes/recentRoutes';
import favoriteRoutes from './routes/favoriteRoutes';
import calendarRoutes from './routes/calendarRoutes';
import searchRoutes from './routes/searchRoutes';

const app: Application = express();

app.use(helmet());
app.use(cookieParser());
app.use(cors({
    origin: config.frontendUrl,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json({ limit: config.requestBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: config.requestBodyLimit }));
app.use(sanitizeBody);

app.get('/health', (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'Jotter API is running',
        timestamp: new Date().toISOString(),
        environment: config.env,
    });
});

app.get('/api', (_req, res) => {
    res.status(200).json({
        success: true,
        message: 'Welcome to Jotter API',
        version: '1.0.0',
        documentation: '/api/docs',
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', apiLimiter, userRoutes);
app.use('/api/folders', apiLimiter, folderRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/notes', apiLimiter, noteRoutes);
app.use('/api/storage', apiLimiter, storageRoutes);
app.use('/api/recent', apiLimiter, recentRoutes);
app.use('/api/favorites', apiLimiter, favoriteRoutes);
app.use('/api/calendar', apiLimiter, calendarRoutes);
app.use('/api/search', apiLimiter, searchRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
