import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { db, nextId, OrganiserPlan, OrganiserRecord, OrganiserStatus, saveDb } from '../../common/utils/in-memory-db';
import { AppRole } from '../rbac/role.enum';
import { PaymentsService, SIMULATED_PRICES } from '../payments/payments.service';
import { UsersService } from '../users/users.service';

const PLAN_LIMITS: Record<OrganiserPlan, { maxActiveTournaments: number | null; maxParticipants: number | null }> = {
  free: { maxActiveTournaments: 1, maxParticipants: 100 },
  premium: { maxActiveTournaments: null, maxParticipants: null }, // null = unlimited
};

@Injectable()
export class OrganisersService {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly usersService: UsersService,
  ) {}

  private findByUserId(userId: number): OrganiserRecord | undefined {
    // Latest application for this user wins (in case a rejected applicant re-applies later)
    const matches = db.organisers.filter((item) => item.userId === userId);
    return matches[matches.length - 1];
  }

  /** Powers the Admin Dashboard approval queue (doc §11/§19). */
  findAll(status?: OrganiserStatus) {
    const records = status ? db.organisers.filter((item) => item.status === status) : db.organisers;
    return records.map((item) => {
      const user = db.users.find((u) => u.id === item.userId);
      return { ...item, username: user?.username, email: user?.email };
    });
  }

  apply(userId: number, experienceNote?: string): OrganiserRecord {
    const existing = this.findByUserId(userId);
    if (existing && existing.status !== 'rejected') {
      throw new BadRequestException(`User ${userId} already has a ${existing.status} organiser application`);
    }

    const created: OrganiserRecord = {
      id: nextId('organiser'),
      userId,
      status: 'pending',
      plan: 'free',
      experienceNote,
      appliedAt: new Date().toISOString(),
    };
    db.organisers.push(created);
    saveDb();
    return created;
  }

  setStatus(id: number, status: OrganiserStatus): OrganiserRecord {
    const record = db.organisers.find((item) => item.id === id);
    if (!record) {
      throw new NotFoundException(`Organiser application ${id} not found`);
    }
    record.status = status;
    if (status === 'verified') {
      record.verifiedAt = new Date().toISOString();
      this.usersService.update(record.userId, { role: AppRole.ORGANIZER });
    }
    saveDb();
    return record;
  }

  profile(userId: number) {
    const record = this.findByUserId(userId);
    const plan = record?.plan || 'free';
    return {
      status: record?.status || 'none',
      plan,
      appliedAt: record?.appliedAt,
      verifiedAt: record?.verifiedAt,
      limits: PLAN_LIMITS[plan],
    };
  }

  analytics(userId: number) {
    const myEvents = db.events.filter((event) => event.organiserId === userId);
    const eventIds = new Set(myEvents.map((event) => event.id));
    const registrations = db.eventRegistrations.filter((reg) => eventIds.has(reg.eventId));

    // Doc §16 Revenue Sharing — informational split per tournament's collected entry fees.
    // Only the 15% platform cut is ever actually logged to the payments ledger (see
    // event-registrations.service.ts); the rest is a display-only estimate here.
    let totalCollected = 0;
    myEvents.forEach((event) => {
      if (!event.entryFee) return;
      const regsForEvent = registrations.filter((reg) => reg.eventId === event.id).length;
      totalCollected += event.entryFee * regsForEvent;
    });

    return {
      totalTournaments: myEvents.length,
      approvedTournaments: myEvents.filter((event) => event.status === 'approved').length,
      pendingTournaments: myEvents.filter((event) => event.status === 'pending').length,
      totalRegistrations: registrations.length,
      averageRegistrationsPerTournament: myEvents.length ? Math.round((registrations.length / myEvents.length) * 10) / 10 : 0,
      totalEntryFeeCollected: totalCollected,
      estimatedOrganiserEarnings: Math.round(totalCollected * 0.15),
    };
  }

  upgradePlan(userId: number, plan: OrganiserPlan): OrganiserRecord {
    const record = this.findByUserId(userId);
    if (!record) {
      throw new NotFoundException(`User ${userId} has no organiser application — apply first`);
    }
    if (record.plan !== plan) {
      record.plan = plan;
      saveDb();
      if (plan === 'premium') {
        this.paymentsService.record(userId, 'organiser_subscription', SIMULATED_PRICES.organiser_premium, 'Upgraded to Organizer Premium');
      }
    }
    return record;
  }

  /** Used by the OrganizerLimitMiddleware — free tier is capped, premium/verified-admin is not. */
  limitsFor(userId: number) {
    const record = this.findByUserId(userId);
    const plan = record?.plan || 'free';
    return PLAN_LIMITS[plan];
  }
}
