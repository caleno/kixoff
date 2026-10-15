// ===== KIXoff Logger =====

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

const COLORS: Record<LogLevel, string> = {
  info: '\x1b[36m',
  warn: '\x1b[33m',
  error: '\x1b[31m',
  debug: '\x1b[37m',
};
const RESET = '\x1b[0m';

function log(level: LogLevel, message: string, meta?: unknown): void {
  const timestamp = new Date().toISOString();
  const color = COLORS[level];
  const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';

  if (level === 'error') {
    console.error(`${color}[${timestamp}] [${level.toUpperCase()}]${RESET} ${message}${metaStr}`);
  } else if (level === 'debug' && process.env.NODE_ENV !== 'production') {
    console.debug(`${color}[${timestamp}] [${level.toUpperCase()}]${RESET} ${message}${metaStr}`);
  } else {
    console.log(`${color}[${timestamp}] [${level.toUpperCase()}]${RESET} ${message}${metaStr}`);
  }
}

export const logger = {
  info: (msg: string, meta?: unknown) => log('info', msg, meta),
  warn: (msg: string, meta?: unknown) => log('warn', msg, meta),
  error: (msg: string, meta?: unknown) => log('error', msg, meta),
  debug: (msg: string, meta?: unknown) => log('debug', msg, meta),
};
