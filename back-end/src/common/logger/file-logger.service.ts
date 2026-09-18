import { Injectable, LoggerService } from '@nestjs/common';
import { existsSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import * as winston from 'winston';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const DailyRotateFile = require('winston-daily-rotate-file');

@Injectable()
export class FileLoggerService implements LoggerService {
  private winstonLogger: winston.Logger;
  private logsDir: string;

  constructor() {
    this.logsDir = join(process.cwd(), 'logs');
    if (!existsSync(this.logsDir)) {
      mkdirSync(this.logsDir, { recursive: true });
    }

    const redactFormat = winston.format((info) => {
      if (typeof info.message === 'object') {
        info.message = this.sanitizeObject(info.message);
      }
      return info;
    });

    const customFormat = winston.format.combine(
      redactFormat(),
      winston.format.timestamp({ format: 'YYYY-MM-DDTHH:mm:ss.SSSZ' }),
      winston.format.printf(({ timestamp, level, message }) => {
        const formattedMsg =
          typeof message === 'object' ? JSON.stringify(message) : message;
        return `${timestamp} | ${level.toUpperCase().padEnd(7)} | ${formattedMsg}`;
      }),
    );

    const accessTransport = new DailyRotateFile({
      dirname: this.logsDir,
      filename: 'access-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    });

    const errorTransport = new DailyRotateFile({
      dirname: this.logsDir,
      filename: 'error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',
    });

    const combinedTransport = new DailyRotateFile({
      dirname: this.logsDir,
      filename: 'combined-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    });

    // Main standard file links
    const staticAccessTransport = new winston.transports.File({
      filename: join(this.logsDir, 'access.log'),
    });

    const staticErrorTransport = new winston.transports.File({
      filename: join(this.logsDir, 'error.log'),
      level: 'error',
    });

    const staticCombinedTransport = new winston.transports.File({
      filename: join(this.logsDir, 'combined.log'),
    });

    this.winstonLogger = winston.createLogger({
      level: 'info',
      format: customFormat,
      transports: [
        new winston.transports.Console(),
        accessTransport,
        errorTransport,
        combinedTransport,
        staticAccessTransport,
        staticErrorTransport,
        staticCombinedTransport,
      ],
    });
  }

  private sanitizeObject(obj: any): any {
    if (!obj || typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map((item) => this.sanitizeObject(item));

    const sensitiveKeys = [
      'password',
      'pass',
      'token',
      'authorization',
      'auth',
      'secret',
      'apikey',
      'api_key',
      'cookie',
      'session',
    ];

    const sanitized: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      if (sensitiveKeys.includes(key.toLowerCase())) {
        sanitized[key] = '[REDACTED]';
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = this.sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
    return sanitized;
  }

  logAccess(data: {
    method: string;
    url: string;
    statusCode: number;
    responseTimeMs: number;
    ip: string;
    role?: string;
    userId?: string | number;
  }) {
    const roleInfo = data.role ? ` | Role: ${data.role}` : '';
    const userInfo = data.userId ? ` | User: ${data.userId}` : '';
    const logLine = `${data.method} | ${data.url} | ${data.statusCode} | ${data.responseTimeMs}ms | IP: ${data.ip}${roleInfo}${userInfo}`;
    this.winstonLogger.info(logLine);
  }

  log(message: any, context?: string) {
    const ctx = context ? `[${context}] ` : '';
    this.winstonLogger.info(`${ctx}${typeof message === 'object' ? JSON.stringify(this.sanitizeObject(message)) : message}`);
  }

  error(message: any, trace?: string, context?: string) {
    const ctx = context ? `[${context}] ` : '';
    const errText = typeof message === 'object' ? JSON.stringify(this.sanitizeObject(message)) : message;
    const traceText = trace ? ` | Stack: ${trace}` : '';
    this.winstonLogger.error(`${ctx}${errText}${traceText}`);
  }

  warn(message: any, context?: string) {
    const ctx = context ? `[${context}] ` : '';
    this.winstonLogger.warn(`${ctx}${typeof message === 'object' ? JSON.stringify(this.sanitizeObject(message)) : message}`);
  }

  debug(message: any, context?: string) {
    const ctx = context ? `[${context}] ` : '';
    this.winstonLogger.debug(`${ctx}${typeof message === 'object' ? JSON.stringify(this.sanitizeObject(message)) : message}`);
  }
}
