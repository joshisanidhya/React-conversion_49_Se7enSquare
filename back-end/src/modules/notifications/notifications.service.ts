import { Injectable, NotFoundException } from '@nestjs/common';
import { db, NotificationRecord, nextId, saveDb } from '../../common/utils/in-memory-db';

@Injectable()
export class NotificationsService {
  findForUser(userId: number): NotificationRecord[] {
    return db.notifications
      .filter((item) => item.userId === userId)
      .sort((a, b) => b.id - a.id);
  }

  markRead(id: number, read: boolean): NotificationRecord {
    const notification = db.notifications.find((item) => item.id === id);
    if (!notification) throw new NotFoundException(`Notification with id ${id} not found`);
    notification.read = read;
    saveDb();
    return notification;
  }

  markAllRead(userId: number): { message: string } {
    let count = 0;
    db.notifications.forEach((item) => {
      if (item.userId === userId && !item.read) {
        item.read = true;
        count += 1;
      }
    });
    saveDb();
    return { message: `${count} notification(s) marked read` };
  }

  /**
   * Internal helper other services call directly (no cross-module DI, matching
   * this project's existing pattern of touching `db` straight from services).
   * Not exposed as an HTTP route.
   */
  static push(entry: Omit<NotificationRecord, 'id' | 'read' | 'createdAt'>): void {
    db.notifications.unshift({
      id: nextId('notification'),
      read: false,
      createdAt: new Date().toISOString(),
      ...entry,
    });
    saveDb();
  }
}
