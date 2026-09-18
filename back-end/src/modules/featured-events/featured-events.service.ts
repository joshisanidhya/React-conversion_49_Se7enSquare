import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { db, FeaturedEventRecord, nextId, saveDb } from '../../common/utils/in-memory-db';
import { PaymentsService, SIMULATED_PRICES } from '../payments/payments.service';

@Injectable()
export class FeaturedEventsService {
  constructor(private readonly paymentsService: PaymentsService) {}

  create(eventId: number, userId: number, durationDays = 7): FeaturedEventRecord {
    const event = db.events.find((item) => item.id === eventId);
    if (!event) {
      throw new BadRequestException(`eventId ${eventId} does not reference an existing event`);
    }

    const startAt = new Date();
    const endAt = new Date(startAt.getTime() + durationDays * 24 * 60 * 60 * 1000);

    const created: FeaturedEventRecord = {
      id: nextId('featuredEvent'),
      eventId,
      userId,
      startAt: startAt.toISOString(),
      endAt: endAt.toISOString(),
      status: 'active',
    };
    db.featuredEvents.push(created);
    saveDb();

    this.paymentsService.record(userId, 'featured_event', SIMULATED_PRICES.featured_event, `Featured promotion for "${event.title}"`);

    return created;
  }

  findAll() {
    const now = Date.now();
    return db.featuredEvents
      .filter((item) => item.status === 'active' && new Date(item.endAt).getTime() > now)
      .map((item) => ({
        ...item,
        event: db.events.find((event) => event.id === item.eventId) || null,
      }))
      .filter((item) => item.event !== null);
  }

  remove(id: number): { message: string } {
    const record = db.featuredEvents.find((item) => item.id === id);
    if (!record) {
      throw new NotFoundException(`Featured event ${id} not found`);
    }
    db.featuredEvents = db.featuredEvents.filter((item) => item.id !== id);
    saveDb();
    return { message: `Featured event ${id} removed` };
  }
}
