import { Injectable, NotFoundException } from '@nestjs/common';
import { AppealRecord, db, nextId, saveDb } from '../../common/utils/in-memory-db';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class AppealsService {
  findAll(): AppealRecord[] {
    return db.appeals;
  }

  create(payload: Partial<AppealRecord>): AppealRecord {
    const created: AppealRecord = {
      id: nextId('appeal'),
      userId: payload.userId,
      actionId: payload.actionId || 'ACT-DNX-2025-003847',
      text: payload.text || '',
      acknowledgement: payload.acknowledgement || '',
      resolution: payload.resolution || '',
      evidence: payload.evidence || [],
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    db.appeals.push(created);
    saveDb();
    return created;
  }

  addEvidence(id: number, payload: { fileName?: string; url?: string }): AppealRecord {
    const appeal = db.appeals.find((item) => item.id === id);
    if (!appeal) throw new NotFoundException(`Appeal with id ${id} not found`);
    appeal.evidence.push(payload.url || payload.fileName || 'evidence-file');
    saveDb();
    return appeal;
  }

  updateStatus(id: number, status: AppealRecord['status']): AppealRecord {
    const appeal = db.appeals.find((item) => item.id === id);
    if (!appeal) throw new NotFoundException(`Appeal with id ${id} not found`);
    appeal.status = status;
    saveDb();

    if (appeal.userId && (status === 'approved' || status === 'rejected')) {
      NotificationsService.push({
        userId: appeal.userId,
        type: 'system',
        text: `Your appeal (#${appeal.id}) was ${status}`,
        targetId: appeal.id,
      });
    }

    return appeal;
  }
}
