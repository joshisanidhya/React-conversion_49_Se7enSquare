import { Injectable } from '@nestjs/common';
import { db, PlatformConfigRecord, saveDb } from '../../common/utils/in-memory-db';

@Injectable()
export class PlatformConfigService {
  findOne(): PlatformConfigRecord {
    return db.platformConfig;
  }

  update(payload: Partial<PlatformConfigRecord>): PlatformConfigRecord {
    Object.assign(db.platformConfig, payload);
    saveDb();
    return db.platformConfig;
  }
}
