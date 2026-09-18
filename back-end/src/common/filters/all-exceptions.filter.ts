import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { FileLoggerService } from '../logger/file-logger.service';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: FileLoggerService) {}

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message: string | object = 'Internal server error';

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'object' && res !== null && 'message' in res) {
        const msg = (res as any).message;
        message = Array.isArray(msg) ? msg.join(', ') : msg;
      } else if (typeof res === 'string') {
        message = res;
      } else {
        message = exception.message;
      }
    } else if (exception instanceof Error) {
      // Sanitize filesystem paths from error messages (e.g. ENOENT from ServeStatic)
      // to prevent leaking internal directory structure in error responses
      message = exception.message.replace(/\/[^\s,]+/g, '[path]');
    }

    const isProduction = process.env.NODE_ENV === 'production';

    // Always return a safe generic message for unexpected 500 errors (no internal details to clients)
    const clientMessage =
      status === HttpStatus.INTERNAL_SERVER_ERROR
        ? 'Internal server error'
        : message;

    const errorResponse: Record<string, any> = {
      success: false,
      statusCode: status,
      message: clientMessage,
      path: request.url,
      timestamp: new Date().toISOString(),
    };

    // Include sanitized stack trace in development (NOT production, NOT for 500s which might leak paths)
    if (!isProduction && status !== HttpStatus.INTERNAL_SERVER_ERROR && exception instanceof Error && exception.stack) {
      // Sanitize absolute paths from stack trace before including in client response
      errorResponse.stack = exception.stack.replace(/\/[^\s:)]+/g, (match) =>
        match.includes('node_modules') ? match : '[path]',
      );
    }

    // Log the error to error.log
    const stackTrace = exception instanceof Error ? exception.stack : undefined;
    this.logger.error(
      `HTTP ${status} on ${request.method} ${request.url} - ${JSON.stringify(clientMessage)}`,
      stackTrace,
      'AllExceptionsFilter',
    );

    response.status(status).json(errorResponse);
  }
}
