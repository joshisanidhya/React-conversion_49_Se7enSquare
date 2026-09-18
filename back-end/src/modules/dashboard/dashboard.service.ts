import { Injectable } from '@nestjs/common';
import { db } from '../../common/utils/in-memory-db';
import { PaymentsService } from '../payments/payments.service';

@Injectable()
export class DashboardService {
  constructor(private readonly paymentsService: PaymentsService) {}

  getStats() {
    return {
      totalUsers: db.users.length,
      totalCommunities: db.communities.length,
      totalEvents: db.events.length,
      pendingReportsCount: db.reports.filter((report) => report.status === 'pending').length,
      pendingAppealsCount: db.appeals.filter((appeal) => appeal.status === 'pending').length,
      pendingEventsCount: db.events.filter((event) => event.status === 'pending').length,
      totalMemberships: db.memberships.length,
    };
  }

  /** Powers the read-only Owner "Revenue Overview" dashboard (doc §5/§19). */
  getRevenueStats() {
    const summary = this.paymentsService.summary();
    return {
      ...summary,
      premiumUsers: db.subscriptions.filter((sub) => sub.status === 'active' && sub.plan !== 'free').length,
      verifiedOrganisers: db.organisers.filter((org) => org.status === 'verified').length,
      pendingOrganiserApplications: db.organisers.filter((org) => org.status === 'pending').length,
      activeFeaturedEvents: db.featuredEvents.filter((item) => item.status === 'active' && new Date(item.endAt).getTime() > Date.now()).length,
    };
  }
}
