import { Injectable } from '@nestjs/common';
import { AuditLogRecord, db, nextId, saveDb } from '../../common/utils/in-memory-db';

@Injectable()
export class AuditService {
  findAll(): AuditLogRecord[] {
    return db.auditLog;
  }

  create(payload: Partial<AuditLogRecord>): AuditLogRecord {
    const created: AuditLogRecord = {
      id: nextId('auditLog'),
      action: payload.action || 'Action',
      actor: payload.actor || 'system',
      target: payload.target,
      reason: payload.reason,
      createdAt: new Date().toISOString(),
    };
    db.auditLog.unshift(created);
    saveDb();
    return created;
  }
}
