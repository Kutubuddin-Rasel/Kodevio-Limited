import config from '../config';

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
    level: LogLevel;
    message: string;
    timestamp: string;
    data?: unknown;
}

class Logger {
    private level: LogLevel;
    private levels: Record<LogLevel, number> = { debug: 0, info: 1, warn: 2, error: 3 };

    constructor() {
        this.level = (config.logLevel as LogLevel) || 'info';
    }

    private shouldLog(level: LogLevel): boolean {
        return this.levels[level] >= this.levels[this.level];
    }

    private formatMessage(entry: LogEntry): string {
        const prefix = `[${entry.timestamp}] [${entry.level.toUpperCase()}]`;
        return entry.data ? `${prefix} ${entry.message} ${JSON.stringify(entry.data)}` : `${prefix} ${entry.message}`;
    }

    private log(level: LogLevel, message: string, data?: unknown): void {
        if (!this.shouldLog(level)) return;

        const entry: LogEntry = { level, message, timestamp: new Date().toISOString(), data };
        const formatted = this.formatMessage(entry);

        switch (level) {
            case 'error':
                console.error(formatted);
                break;
            case 'warn':
                console.warn(formatted);
                break;
            default:
                console.log(formatted);
        }
    }

    debug(message: string, data?: unknown): void {
        this.log('debug', message, data);
    }

    info(message: string, data?: unknown): void {
        this.log('info', message, data);
    }

    warn(message: string, data?: unknown): void {
        this.log('warn', message, data);
    }

    error(message: string, data?: unknown): void {
        this.log('error', message, data);
    }
}

export const logger = new Logger();
export default logger;
