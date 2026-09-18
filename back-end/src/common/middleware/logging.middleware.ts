import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { FileLoggerService } from '../logger/file-logger.service';

@Injectable()
export class LoggingMiddleware implements NestMiddleware {
  constructor(private readonly logger: FileLoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const startTime = Date.now();
    const { method, originalUrl } = req;
    const ip =
      (req.headers['x-forwarded-for'] as string)?.split(',')[0] ||
      req.socket.remoteAddress ||
      '127.0.0.1';
    const role = (req.headers['x-role'] as string) || 'guest';

    res.on('finish', () => {
      const responseTimeMs = Date.now() - startTime;
      const { statusCode } = res;

      this.logger.logAccess({
        method,
        url: originalUrl,
        statusCode,
        responseTimeMs,
        ip,
        role,
      });
    });

    next();
  }
}
