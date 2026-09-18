import { ForbiddenException, Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { db } from '../utils/in-memory-db';
import { OrganisersService } from '../../modules/organisers/organisers.service';
import { SubscriptionsService } from '../../modules/subscriptions/subscriptions.service';
import { FileLoggerService } from '../logger/file-logger.service';

const FREE_COMMUNITY_LIMIT = 4;

/**
 * Router-level middleware scoped to POST /api/communities (doc §8/§20 — User
 * Subscription feature gating). Free-plan users are capped at 4 communities;
 * Plus/Ultra Pro are not gated here (Plus's own 10-community cap is a soft
 * product limit, not enforced server-side in this pass — only the free
 * ceiling is a hard block, matching how CreateCommunityDto.ownerId already
 * carries client-supplied identity in this trust model).
 */
@Injectable()
export class SubscriptionLimitMiddleware implements NestMiddleware {
  constructor(
    private readonly subscriptionsService: SubscriptionsService,
    private readonly logger: FileLoggerService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const ownerId = Number(req.body?.ownerId);
    if (!ownerId) {
      return next(); // no owner asserted — let the controller's own validation reject it
    }

    const { plan } = this.subscriptionsService.status(ownerId);
    if (plan === 'free') {
      const owned = db.communities.filter((item) => item.ownerId === ownerId).length;
      if (owned >= FREE_COMMUNITY_LIMIT) {
        this.logger.warn(`[FeatureGating: Subscription] user ${ownerId} hit the free-plan community limit (${FREE_COMMUNITY_LIMIT})`);
        throw new ForbiddenException(
          `Free plan is limited to ${FREE_COMMUNITY_LIMIT} communities — upgrade to Plus or Ultra Pro to create more.`,
        );
      }
    }

    next();
  }
}

/**
 * Router-level middleware scoped to POST /api/events (doc §9/§20 — Organizer
 * Subscription feature gating). Only applies when the payload carries an
 * organiserId (i.e. this is an organizer-hosted tournament, not a regular
 * community event) — Free Organizer is capped at 1 active tournament and
 * 100 participants; Premium is unlimited.
 */
@Injectable()
export class OrganizerLimitMiddleware implements NestMiddleware {
  constructor(
    private readonly organisersService: OrganisersService,
    private readonly logger: FileLoggerService,
  ) {}

  use(req: Request, res: Response, next: NextFunction) {
    const organiserId = Number(req.body?.organiserId);
    if (!organiserId) {
      return next(); // not an organizer-hosted tournament — nothing to gate
    }

    const { maxActiveTournaments, maxParticipants } = this.organisersService.limitsFor(organiserId);

    if (maxActiveTournaments !== null) {
      const active = db.events.filter(
        (item) => item.organiserId === organiserId && item.status !== 'cancelled' && item.status !== 'rejected',
      ).length;
      if (active >= maxActiveTournaments) {
        this.logger.warn(`[FeatureGating: Organizer] user ${organiserId} hit the free-tier tournament limit (${maxActiveTournaments})`);
        throw new ForbiddenException(
          `Free Organizer plan is limited to ${maxActiveTournaments} active tournament(s) — upgrade to Premium Organizer for unlimited tournaments.`,
        );
      }
    }

    if (maxParticipants !== null && req.body?.maxAttendees && Number(req.body.maxAttendees) > maxParticipants) {
      throw new ForbiddenException(
        `Free Organizer plan is limited to ${maxParticipants} participants per tournament — upgrade to Premium Organizer for unlimited participants.`,
      );
    }

    next();
  }
}
