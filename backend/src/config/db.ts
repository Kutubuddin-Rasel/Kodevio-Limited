import mongoose from 'mongoose';
import { logger } from '../utils';
import config from './index';

const connectDB = async (): Promise<void> => {
    try {
        if (!config.mongodbUri) {
            throw new Error('MONGODB_URI is not defined in environment variables');
        }

        const conn = await mongoose.connect(config.mongodbUri);
        logger.info(`MongoDB Connected: ${conn.connection.host}`);

        mongoose.connection.on('error', (err) => logger.error('MongoDB connection error', err));
        mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));
        mongoose.connection.on('reconnected', () => logger.info('MongoDB reconnected'));

        process.on('SIGINT', async () => {
            await mongoose.connection.close();
            logger.info('MongoDB connection closed');
            process.exit(0);
        });
    } catch (error) {
        logger.error('MongoDB connection failed', error);
        process.exit(1);
    }
};

export default connectDB;
