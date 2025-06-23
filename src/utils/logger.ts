import fs from 'fs';
import path from 'path';

export type LogLevel = 'error' | 'warn' | 'info' | 'debug';

class Logger {
    private currentDate: string;
    private stream: fs.WriteStream;
    private readonly order: Record<LogLevel, number> = {
        error: 0,
        warn: 1,
        info: 2,
        debug: 3,
    };

    constructor(
        private logDir: string = 'logs',
        private level: LogLevel = 'info'
    ) {
        this.currentDate = this.formatDate(new Date());
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
        this.stream = fs.createWriteStream(this.logFilePath, { flags: 'a' });
        this.cleanupOldFiles();
    }

    setLevel(level: LogLevel) {
        this.level = level;
    }

    private formatDate(date: Date) {
        return date.toISOString().slice(0, 10);
    }

    private get logFilePath() {
        return path.join(this.logDir, `${this.currentDate}.log`);
    }

    private rotateIfNeeded() {
        const today = this.formatDate(new Date());
        if (today !== this.currentDate) {
            this.stream.end();
            this.currentDate = today;
            this.stream = fs.createWriteStream(this.logFilePath, { flags: 'a' });
            this.cleanupOldFiles();
        }
    }

    private cleanupOldFiles() {
        fs.readdirSync(this.logDir).forEach(file => {
            const match = file.match(/(\d{4}-\d{2}-\d{2})\.log/);
            if (match) {
                const fileDate = new Date(match[1]);
                const diffDays = (Date.now() - fileDate.getTime()) / (1000 * 60 * 60 * 24);
                if (diffDays > 5) {
                    fs.unlinkSync(path.join(this.logDir, file));
                }
            }
        });
    }

    private write(level: LogLevel, message: string, args: any[]) {
        if (this.order[level] > this.order[this.level]) return;
        this.rotateIfNeeded();
        const record = JSON.stringify({ timestamp: new Date().toISOString(), level, message, args });
        this.stream.write(record + '\n');
        if (process.env.NODE_ENV !== 'production') {
            const fn = level === 'error' ? console.error : console.log;
            fn(record);
        }
    }

    error(msg: string, ...args: any[]) {
        this.write('error', msg, args);
    }
    warn(msg: string, ...args: any[]) {
        this.write('warn', msg, args);
    }
    info(msg: string, ...args: any[]) {
        this.write('info', msg, args);
    }
    debug(msg: string, ...args: any[]) {
        this.write('debug', msg, args);
    }
}

const logger = new Logger(process.env.LOG_DIR || 'logs', (process.env.LOG_LEVEL as LogLevel) || 'info');

process.on('uncaughtException', err => {
    logger.error(`Uncaught exception: ${(err as Error).stack || String(err)}`);
});
process.on('unhandledRejection', reason => {
    logger.error(`Unhandled rejection: ${(reason as Error)?.stack || String(reason)}`);
});

export default logger;
