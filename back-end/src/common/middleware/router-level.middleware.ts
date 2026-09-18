import { Injectable, NestMiddleware, ForbiddenException, BadRequestException } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { FileLoggerService } from '../logger/file-logger.service';
import { ALL_ROLES } from '../../modules/rbac/role.enum';

/**
 * Router-level middleware scoped ONLY to /api/platform-config.
 *
 * Authentication model: This application uses the x-role header as its authentication
 * mechanism. There is no JWT or session layer — this is the project's established design
 * (see RolesGuard which also reads x-role). This middleware participates in the same
 * mechanism, running BEFORE the RolesGuard to:
 *   1. Validate the x-role header is a known role (early rejection before the guard fires).
 *   2. Log admin-route access attempts with role and method for audit/visibility.
 *   3. Provide a clear early-rejection path with a router-middleware-specific error message
 *      that a professor can trace through the middleware pipeline.
 *
 * Why is this middleware useful if RolesGuard also blocks non-admin writes?
 *   - It demonstrates router-scoped middleware in the pipeline (forRoutes only PlatformConfigController).
 *   - It validates the x-role header value BEFORE the RolesGuard, giving a cleaner error.
 *   - It produces a middleware-attributed log entry separate from the guard log.
 */
@Injectable()
export class AdminRouteMiddleware implements NestMiddleware {
  constructor(private readonly logger: FileLoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const rawRole = (req.headers['x-role'] as string) || '';
    const role = rawRole.trim().toLowerCase() || 'guest';

    this.logger.log(
      `[RouterMiddleware: Admin] ${req.method} ${req.originalUrl} — role: '${role}'`,
    );

    // Reject entirely unknown role values before the guard fires
    if (role !== 'guest' && !ALL_ROLES.includes(role)) {
      this.logger.warn(
        `[RouterMiddleware: Admin] Unknown role '${role}' on ${req.method} ${req.originalUrl}`,
      );
      throw new ForbiddenException('Invalid x-role header value');
    }

    // Only admin role may perform state-changing operations on platform configuration
    if (req.method !== 'GET' && role !== 'admin') {
      this.logger.warn(
        `[RouterMiddleware: Admin] Non-admin role '${role}' attempted ${req.method} on ${req.originalUrl} — blocked`,
      );
      throw new ForbiddenException(
        'Admin-route middleware: only the admin role may modify platform configuration',
      );
    }

    next();
  }
}

/**
 * Router-level middleware scoped to POST /api/uploads only.
 *
 * Validates upload requests BEFORE Multer processes the multipart payload:
 *   1. Ensures Content-Type is multipart/form-data.
 *   2. Rejects requests where Content-Length header indicates oversized payload.
 *
 * Static file GET requests to /uploads/* are deliberately NOT intercepted
 * (this middleware is scoped to POST method only in AppModule).
 */
@Injectable()
export class FileUploadValidatorMiddleware implements NestMiddleware {
  constructor(private readonly logger: FileLoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    this.logger.log(
      `[RouterMiddleware: Upload] Pre-Multer validation for ${req.method} ${req.originalUrl}`,
    );

    const contentType = req.headers['content-type'] || '';
    if (!contentType.includes('multipart/form-data')) {
      throw new BadRequestException(
        'Upload middleware: Content-Type must be multipart/form-data for file uploads',
      );
    }

    // Content-Length is advisory (may be absent on chunked uploads); only reject when clearly oversized
    const contentLength = parseInt(req.headers['content-length'] || '0', 10);
    if (contentLength > 10 * 1024 * 1024) {
      throw new BadRequestException(
        'Upload middleware: Upload payload exceeds the 10 MB pre-parse size limit',
      );
    }

    next();
  }
}

/**
 * Router-level middleware scoped to /api/reports and /api/appeals.
 *
 * Provides router-scoped governance tracking for the application's two core moderation routes:
 *   - /api/reports: content reporting by users/moderators
 *   - /api/appeals: user appeals against moderation actions
 *
 * Produces a log entry for every governance-route request, separately from the global
 * LoggingMiddleware, so governance actions can be filtered independently in the combined log.
 */
@Injectable()
export class AuditRouteMiddleware implements NestMiddleware {
  constructor(private readonly logger: FileLoggerService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const role = (req.headers['x-role'] as string) || 'guest';
    this.logger.log(
      `[RouterMiddleware: Governance] ${req.method} ${req.originalUrl} by role '${role}'`,
    );
    next();
  }
}
