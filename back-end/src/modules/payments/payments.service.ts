import { Injectable } from '@nestjs/common';
import { db, nextId, PaymentRecord, PaymentType, saveDb } from '../../common/utils/in-memory-db';

/**
 * Simulated pricing — no real payment gateway exists in this project, matching
 * the mock-backend convention used everywhere else (in-memory store, no auth
 * layer). Fixed and documented here rather than configurable.
 */
export const SIMULATED_PRICES = {
  plus: 99,
  ultra_pro: 299,
  organiser_premium: 499,
  featured_event: 199,
} as const;

@Injectable()
export class PaymentsService {
  /** Internal — called by subscriptions/organisers/featured-events services, not exposed as its own endpoint. */
  record(userId: number, type: PaymentType, amount: number, description: string): PaymentRecord {
    const payment: PaymentRecord = {
      id: nextId('payment'),
      userId,
      type,
      amount,
      description,
      createdAt: new Date().toISOString(),
    };
    db.payments.push(payment);
    saveDb();
    return payment;
  }

  history(userId?: number): PaymentRecord[] {
    if (userId === undefined) return db.payments;
    return db.payments.filter((item) => item.userId === userId);
  }

  summary() {
    const totalRevenue = db.payments.reduce((sum, item) => sum + item.amount, 0);
    const byType = db.payments.reduce<Record<string, number>>((acc, item) => {
      acc[item.type] = (acc[item.type] || 0) + item.amount;
      return acc;
    }, {});
    const now = new Date();
    const monthlyRevenue = db.payments
      .filter((item) => {
        const created = new Date(item.createdAt);
        return created.getFullYear() === now.getFullYear() && created.getMonth() === now.getMonth();
      })
      .reduce((sum, item) => sum + item.amount, 0);

    return {
      totalRevenue,
      monthlyRevenue,
      subscriptionRevenue: byType.subscription || 0,
      organiserRevenue: byType.organiser_subscription || 0,
      featuredEventRevenue: byType.featured_event || 0,
      totalTransactions: db.payments.length,
    };
  }
}
