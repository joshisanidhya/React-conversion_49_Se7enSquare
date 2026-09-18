import { Injectable, NotFoundException } from '@nestjs/common';
import { ChatMessageRecord, db, nextId, saveDb } from '../../common/utils/in-memory-db';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class MessagesService {
  findByChannel(channelId: string): ChatMessageRecord[] {
    return db.messages.filter((item) => item.channelId === channelId);
  }

  create(payload: Partial<ChatMessageRecord>): ChatMessageRecord {
    const created: ChatMessageRecord = {
      id: nextId('message'),
      channelId: payload.channelId || 'general',
      communityId: payload.communityId,
      authorId: payload.authorId,
      authorName: payload.authorName || 'User',
      content: payload.content || '',
      attachments: payload.attachments || [],
      reactions: {},
      pinned: false,
      createdAt: new Date().toISOString(),
    };
    db.messages.push(created);
    saveDb();
    return created;
  }

  react(id: number, emoji: string, actorId?: number, actorName?: string): ChatMessageRecord {
    const message = this.findOne(id);
    message.reactions[emoji] = (message.reactions[emoji] || 0) + 1;
    saveDb();

    // Notify the message's author, unless they reacted to their own message.
    if (message.authorId && actorId && String(actorId) !== String(message.authorId)) {
      NotificationsService.push({
        userId: message.authorId,
        type: 'reaction',
        text: `${actorName || 'Someone'} reacted ${emoji} to your message`,
        channelId: message.channelId,
        targetId: message.id,
      });
    }

    return message;
  }

  pin(id: number): ChatMessageRecord {
    const message = this.findOne(id);
    message.pinned = !message.pinned;
    saveDb();
    return message;
  }

  addAttachment(id: number, fileName: string): ChatMessageRecord {
    const message = this.findOne(id);
    message.attachments.push(fileName);
    saveDb();
    return message;
  }

  private findOne(id: number): ChatMessageRecord {
    const message = db.messages.find((item) => item.id === id);
    if (!message) throw new NotFoundException(`Message with id ${id} not found`);
    return message;
  }
}
