import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { db, EventRegistrationRecord, nextId, saveDb } from '../../common/utils/in-memory-db';
import { PaymentsService } from '../payments/payments.service';

// Doc §16 Revenue Sharing Model: Prize Pool 60% / Organizer 15% / Moderator team 10% /
// Platform Commission 15%. "Platform revenue comes only from commission" (doc's own
// conclusion) — so only the platform's cut is logged to the payments ledger; the
// other splits are informational only (surfaced via organiser analytics), not paid out.
const PLATFORM_COMMISSION_RATE = 0.15;

@Injectable()
export class EventRegistrationsService {
  constructor(private readonly paymentsService: PaymentsService) {}

  findAll(userId?: number, eventId?: number): EventRegistrationRecord[] {
    return db.eventRegistrations.filter((item) =>
      (!userId || item.userId === userId) && (!eventId || item.eventId === eventId),
    );
  }

  create(payload: {
    eventId: number;
    userId: number;
    fullName?: string;
    contactEmail?: string;
    phone?: string;
    inGameId?: string;
  }): EventRegistrationRecord {
    const event = db.events.find((item) => item.id === payload.eventId);
    if (!event) throw new BadRequestException('eventId must reference an existing event');
    if (!db.users.some((item) => item.id === payload.userId)) {
      throw new BadRequestException('userId must reference an existing user');
    }
    const exists = db.eventRegistrations.find((item) => item.eventId === payload.eventId && item.userId === payload.userId);
    if (exists) return exists;
    if (event.maxAttendees && (event.attendees || 0) >= event.maxAttendees) {
      throw new BadRequestException('Event is full');
    }
    const created: EventRegistrationRecord = {
      id: nextId('eventRegistration'),
      eventId: payload.eventId,
      userId: payload.userId,
      registeredAt: new Date().toISOString(),
      fullName: payload.fullName,
      contactEmail: payload.contactEmail,
      phone: payload.phone,
      inGameId: payload.inGameId,
    };
    db.eventRegistrations.push(created);
    event.attendees = (event.attendees || 0) + 1;
    saveDb();

    if (event.entryFee && event.entryFee > 0) {
      const platformCommission = Math.round(event.entryFee * PLATFORM_COMMISSION_RATE);
      this.paymentsService.record(
        payload.userId,
        'tournament_commission',
        platformCommission,
        `Platform commission (15%) on ₹${event.entryFee} entry fee — "${event.title}"`,
      );
    }

    return created;
  }

  remove(id: number): { message: string } {
    const registration = db.eventRegistrations.find((item) => item.id === id);
    if (!registration) throw new NotFoundException(`Event registration with id ${id} not found`);
    const event = db.events.find((item) => item.id === registration.eventId);
    if (event) event.attendees = Math.max(0, (event.attendees || 0) - 1);
    db.eventRegistrations = db.eventRegistrations.filter((item) => item.id !== id);
    saveDb();
    return { message: `Event registration ${id} deleted` };
  }
}
