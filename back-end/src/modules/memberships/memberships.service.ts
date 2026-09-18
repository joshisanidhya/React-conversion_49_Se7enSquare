import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { db, MembershipRecord, nextId, saveDb } from '../../common/utils/in-memory-db';
import { CreateMembershipDto } from './dto/create-membership.dto';

@Injectable()
export class MembershipsService {
  findAll(): MembershipRecord[] {
    return db.memberships;
  }

  findByCommunity(communityId: number): MembershipRecord[] {
    return db.memberships.filter((m) => m.communityId === communityId);
  }

  findByUser(userId: number): MembershipRecord[] {
    return db.memberships.filter((m) => m.userId === userId);
  }

  create(payload: CreateMembershipDto): MembershipRecord {
    const user = db.users.find((u) => u.id === payload.userId);
    if (!user) throw new BadRequestException('userId must reference an existing user');

    const community = db.communities.find((c) => c.id === payload.communityId);
    if (!community) throw new BadRequestException('communityId must reference an existing community');

    const existing = db.memberships.find(
      (m) => m.userId === payload.userId && m.communityId === payload.communityId,
    );
    if (existing) throw new BadRequestException('User is already a member of this community');

    const created: MembershipRecord = {
      id: nextId('membership'),
      userId: payload.userId,
      communityId: payload.communityId,
      joinedAt: new Date().toISOString(),
    };
    db.memberships.push(created);
    saveDb();
    return created;
  }

  remove(id: number): { message: string } {
    const membership = db.memberships.find((m) => m.id === id);
    if (!membership) throw new NotFoundException(`Membership with id ${id} not found`);
    db.memberships = db.memberships.filter((m) => m.id !== id);
    saveDb();
    return { message: `Membership ${id} removed` };
  }
}
