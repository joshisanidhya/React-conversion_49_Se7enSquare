import { BadRequestException, Injectable } from '@nestjs/common';
import { db, nextId, RatingRecord, RatingTargetType, saveDb } from '../../common/utils/in-memory-db';

@Injectable()
export class RatingsService {
  create(targetType: RatingTargetType, targetUserId: number, raterId: number, score: number, comment?: string): RatingRecord {
    if (targetUserId === raterId) {
      throw new BadRequestException('You cannot rate yourself');
    }
    const created: RatingRecord = {
      id: nextId('rating'),
      targetType,
      targetUserId,
      raterId,
      score,
      comment,
      createdAt: new Date().toISOString(),
    };
    db.ratings.push(created);
    saveDb();
    return created;
  }

  forTarget(targetType: RatingTargetType, targetUserId: number) {
    const ratings = db.ratings.filter((item) => item.targetType === targetType && item.targetUserId === targetUserId);
    const average = ratings.length ? Math.round((ratings.reduce((sum, item) => sum + item.score, 0) / ratings.length) * 10) / 10 : 0;
    return { average, count: ratings.length, ratings };
  }
}
