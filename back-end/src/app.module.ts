import { MiddlewareConsumer, Module, NestModule, RequestMethod } from '@nestjs/common';
import { APP_FILTER, APP_GUARD } from '@nestjs/core';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'node:path';
import { RolesGuard } from './common/guards/roles.guard';
import { FileLoggerService } from './common/logger/file-logger.service';
import { LoggingMiddleware } from './common/middleware/logging.middleware';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import {
  AdminRouteMiddleware,
  FileUploadValidatorMiddleware,
  AuditRouteMiddleware,
} from './common/middleware/router-level.middleware';
import { SubscriptionLimitMiddleware, OrganizerLimitMiddleware } from './common/middleware/feature-gating.middleware';
import { CommunitiesModule } from './modules/communities/communities.module';
import { DashboardModule } from './modules/dashboard/dashboard.module';
import { EventsModule } from './modules/events/events.module';
import { PostsModule } from './modules/posts/posts.module';
import { RbacModule } from './modules/rbac/rbac.module';
import { ReportsModule } from './modules/reports/reports.module';
import { UsersModule } from './modules/users/users.module';
import { MembershipsModule } from './modules/memberships/memberships.module';
import { AppealsModule } from './modules/appeals/appeals.module';
import { AuditModule } from './modules/audit/audit.module';
import { AuthModule } from './modules/auth/auth.module';
import { EventRegistrationsModule } from './modules/event-registrations/event-registrations.module';
import { MessagesModule } from './modules/messages/messages.module';
import { PlatformConfigModule } from './modules/platform-config/platform-config.module';
import { UploadModule } from './modules/upload/upload.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { SubscriptionsModule } from './modules/subscriptions/subscriptions.module';
import { OrganisersModule } from './modules/organisers/organisers.module';
import { FeaturedEventsModule } from './modules/featured-events/featured-events.module';
import { ModeratorCertificationModule } from './modules/moderator-certification/moderator-certification.module';
import { RatingsModule } from './modules/ratings/ratings.module';
import { PlatformConfigController } from './modules/platform-config/platform-config.controller';
import { UploadController } from './modules/upload/upload.controller';
import { ReportsController } from './modules/reports/reports.controller';
import { AppealsController } from './modules/appeals/appeals.controller';
// NOTE: back-end/src/users/ (UserModule) is intentionally NOT registered here.
// It declares its own @Controller('users') @Get() that returns raw HTML,
// which collides with the real UsersModule already imported below (same
// /api/users route, JSON). Wiring both in breaks /api/users — the endpoint
// nearly every page depends on — for whichever controller loses the race.
// If this module gets finished, give it its own route path first.
@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
    }),
    RbacModule,
    UsersModule,
    CommunitiesModule,
    EventsModule,
    ReportsModule,
    PostsModule,
    DashboardModule,
    MembershipsModule,
    AuthModule,
    EventRegistrationsModule,
    AppealsModule,
    MessagesModule,
    AuditModule,
    PlatformConfigModule,
    UploadModule,
    NotificationsModule,
    PaymentsModule,
    SubscriptionsModule,
    OrganisersModule,
    FeaturedEventsModule,
    ModeratorCertificationModule,
    RatingsModule,
  ],
  providers: [
    FileLoggerService,
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    // Global Logging Middleware across all routes
    consumer.apply(LoggingMiddleware).forRoutes({ path: '*', method: RequestMethod.ALL });

    // Router-level Middleware for Admin & Platform Config routes.
    // Scoped ONLY to PlatformConfigController — PATCH /api/platform-config requires admin.
    // AuditController deliberately excluded: it allows both admin AND moderator on POST.
    consumer.apply(AdminRouteMiddleware).forRoutes(PlatformConfigController);

    // Router-level Middleware for Upload routes — POST only.
    // Scoped to POST method only so GET requests to /uploads/* static files are NOT intercepted.
    consumer
      .apply(FileUploadValidatorMiddleware)
      .forRoutes({ path: 'uploads', method: RequestMethod.POST });

    // Router-level Middleware for Governance/Audit routes.
    // Tracks all access to moderation and appeal routes for audit purposes.
    consumer.apply(AuditRouteMiddleware).forRoutes(ReportsController, AppealsController);

    // Router-level Middleware for revenue-model feature gating (doc §20).
    // Scoped to POST only — GET/PATCH/DELETE on these controllers are untouched.
    consumer
      .apply(SubscriptionLimitMiddleware)
      .forRoutes({ path: 'communities', method: RequestMethod.POST });
    consumer
      .apply(OrganizerLimitMiddleware)
      .forRoutes({ path: 'events', method: RequestMethod.POST });
  }
}
