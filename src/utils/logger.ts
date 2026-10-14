// ===== KIXoff Logger =====

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3,
};

const currentLevel: LogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

class Logger {
  private log(level: LogLevel, message: string, meta?: Record<string, unknown>): void {
    if (LOG_LEVELS[level] < LOG_LEVELS[currentLevel]) return;

    const timestamp = new Date().toISOString();
    const prefix = level.toUpperCase().padEnd(5);
    const metaStr = meta ? ' ' + JSON.stringify(meta) : '';

    if (level === 'error') {
      console.error(`[${timestamp}] ${prefix} ${message}${metaStr}`);
    } else if (level === 'warn') {
      console.warn(`[${timestamp}] ${prefix} ${message}${metaStr}`);
    } else {
      console.log(`[${timestamp}] ${prefix} ${message}${metaStr}`);
    }
  }

  info(message: string, meta?: Record<string, unknown>): void {
    this.log('info', message, meta);
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    this.log('warn', message, meta);
  }

  error(message: string, meta?: Record<string, unknown>): void {
    this.log('error', message, meta);
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    this.log('debug', message, meta);
  }
}

export const logger = new Logger();
