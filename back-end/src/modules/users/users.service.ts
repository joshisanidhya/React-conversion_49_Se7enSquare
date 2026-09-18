import { Injectable, NotFoundException } from '@nestjs/common';
import { db, nextId, saveDb, UserRecord } from '../../common/utils/in-memory-db';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService {
  findAll(): UserRecord[] {
    return db.users;
  }

  findOne(id: number): UserRecord {
    const user = db.users.find((item) => item.id === id);
    if (!user) {
      throw new NotFoundException(`User with id ${id} not found`);
    }
    return user;
  }

  create(payload: CreateUserDto): UserRecord {
    const created: UserRecord = {
      id: nextId('user'),
      ...payload,
    };
    db.users.push(created);
    saveDb();
    return created;
  }

  update(id: number, payload: UpdateUserDto): UserRecord {
    const user = this.findOne(id);
    Object.assign(user, payload);
    saveDb();
    return user;
  }

  remove(id: number): { message: string } {
    this.findOne(id);
    db.users = db.users.filter((item) => item.id !== id);
    db.memberships = db.memberships.filter((item) => item.userId !== id);
    db.posts = db.posts.filter((item) => item.authorId !== id);
    db.reports = db.reports.filter((item) => !(item.targetType === 'user' && item.targetId === id));
    saveDb();
    return { message: `User ${id} deleted` };
  }
}
