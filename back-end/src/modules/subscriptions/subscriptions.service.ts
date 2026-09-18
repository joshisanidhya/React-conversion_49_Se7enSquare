import { Injectable } from '@nestjs/common';
import { db, nextId, saveDb, SubscriptionPlan, SubscriptionRecord } from '../../common/utils/in-memory-db';
import { PaymentsService, SIMULATED_PRICES } from '../payments/payments.service';

const DEFAULT_STATUS: { plan: SubscriptionPlan; status: 'active' } = { plan: 'free', status: 'active' };

@Injectable()
export class SubscriptionsService {
  constructor(private readonly paymentsService: PaymentsService) {}

  private findActive(userId: number): SubscriptionRecord | undefined {
    return db.subscriptions.find((item) => item.userId === userId && item.status === 'active');
  }

  status(userId: number) {
    const active = this.findActive(userId);
    return active
      ? { plan: active.plan, status: active.status, startedAt: active.startedAt }
      : { ...DEFAULT_STATUS, startedAt: undefined };
  }

  upgrade(userId: number, plan: SubscriptionPlan): SubscriptionRecord {
    const current = this.findActive(userId);
    if (current && current.plan === plan) {
      return current; // already on this plan — no-op, no double charge
    }

    if (current) {
      current.status = 'cancelled';
    }

    const created: SubscriptionRecord = {
      id: nextId('subscription'),
      userId,
      plan,
      status: 'active',
      startedAt: new Date().toISOString(),
    };
    db.subscriptions.push(created);
    saveDb();

    if (plan === 'plus' || plan === 'ultra_pro') {
      this.paymentsService.record(userId, 'subscription', SIMULATED_PRICES[plan], `Upgraded to ${plan} plan`);
    }

    return created;
  }

  cancel(userId: number): { message: string } {
    const active = this.findActive(userId);
    if (active) {
      active.status = 'cancelled';
      saveDb();
    }
    return { message: `Subscription for user ${userId} reverted to free plan` };
  }

  /**
   * Powers the Owner dashboard's Subscriptions drill-down. "Premium Users" on
   * that dashboard counts CURRENTLY-active non-free subscriptions (a live
   * snapshot); "Subscription Revenue" is the cumulative sum of every upgrade
   * payment ever logged (never reversed by a later downgrade/cancel) — the
   * two numbers measure different things and won't move together, which is
   * exactly why this breakdown exists: to make that visible instead of just
   * showing a bare count next to a bare total.
   */
  findAll(): { byPlan: Record<string, number>; subscribers: Array<{ userId: number; username: string; plan: SubscriptionPlan; startedAt: string }> } {
    const active = db.subscriptions.filter((sub) => sub.status === 'active');
    const byPlan: Record<string, number> = { free: 0, plus: 0, ultra_pro: 0 };
    active.forEach((sub) => { byPlan[sub.plan] = (byPlan[sub.plan] || 0) + 1; });

    const subscribers = active
      .filter((sub) => sub.plan !== 'free')
      .map((sub) => {
        const user = db.users.find((item) => item.id === sub.userId);
        return { userId: sub.userId, username: user?.username || `user#${sub.userId}`, plan: sub.plan, startedAt: sub.startedAt };
      })
      .sort((a, b) => new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime());

    return { byPlan, subscribers };
  }
}
