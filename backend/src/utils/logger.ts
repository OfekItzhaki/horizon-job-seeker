/**
 * Simple logger utility
 * Provides consistent logging across the application
 */

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

class Logger {
  private isDevelopment = process.env.NODE_ENV !== 'production';

  private formatMessage(level: LogLevel, message: string, meta?: unknown): string {
    const timestamp = new Date().toISOString();
    const metaStr = meta ? ` ${JSON.stringify(meta)}` : '';
    return `[${timestamp}] [${level.toUpperCase()}] ${message}${metaStr}`;
  }

  info(message: string, meta?: unknown): void {
    console.log(this.formatMessage('info', message, meta));
  }

  warn(message: string, meta?: unknown): void {
    console.warn(this.formatMessage('warn', message, meta));
  }

  error(message: string, error?: unknown): void {
    const errorDetails =
      error instanceof Error ? { message: error.message, stack: error.stack } : error;
    console.error(this.formatMessage('error', message, errorDetails));
  }

  debug(message: string, meta?: unknown): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('debug', message, meta));
    }
  }
}

export const logger = new Logger();
