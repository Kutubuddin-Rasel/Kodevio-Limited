import dotenv from 'dotenv';
dotenv.config();

import app from './app';
import connectDB from './config/db';
import config, { validateConfig } from './config';
import { logger } from './utils';

const startServer = async (): Promise<void> => {
    try {
        validateConfig();
        await connectDB();

        const server = app.listen(config.port, () => {
            logger.info(`Server running on port ${config.port} [${config.env}]`);
        });

        const shutdown = async (signal: string) => {
            logger.info(`${signal} received. Shutting down...`);
            server.close(() => {
                logger.info('HTTP server closed');
                process.exit(0);
            });
            setTimeout(() => {
                logger.error('Forced shutdown due to timeout');
                process.exit(1);
            }, 10000);
        };

        process.on('SIGTERM', () => shutdown('SIGTERM'));
        process.on('SIGINT', () => shutdown('SIGINT'));
        process.on('unhandledRejection', (reason: Error) => {
            logger.error('Unhandled Rejection', reason);
            throw reason;
        });
        process.on('uncaughtException', (error: Error) => {
            logger.error('Uncaught Exception', error);
            process.exit(1);
        });
    } catch (error) {
        logger.error('Failed to start server', error);
        process.exit(1);
    }
};

startServer();
