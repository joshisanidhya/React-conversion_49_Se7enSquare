import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import { db, nextId, saveDb, UserRecord } from '../../common/utils/in-memory-db';
import { AppRole } from '../rbac/role.enum';

interface RegisterPayload {
  username: string;
  email: string;
  password: string;
  role?: AppRole;
  firstName?: string;
  lastName?: string;
}

interface LoginPayload {
  login: string;
  password: string;
  role?: AppRole;
}

@Injectable()
export class AuthService {
  register(payload: RegisterPayload): UserRecord {
    const exists = db.users.some((user) =>
      user.email.toLowerCase() === payload.email.toLowerCase() ||
      user.username.toLowerCase() === payload.username.toLowerCase(),
    );
    if (exists) {
      throw new BadRequestException('A user with this email or username already exists');
    }

    const created: UserRecord = {
      id: nextId('user'),
      username: payload.username,
      email: payload.email,
      password: payload.password,
      role: payload.role || AppRole.USER,
      firstName: payload.firstName,
      lastName: payload.lastName,
      avatar: null,
    };
    db.users.push(created);
    saveDb();
    return created;
  }

  login(payload: LoginPayload): UserRecord {
    const login = payload.login.toLowerCase();
    const user = db.users.find((item) =>
      (item.email.toLowerCase() === login || item.username.toLowerCase() === login) &&
      (item.password || 'Demo@123') === payload.password,
    );
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }
    if (payload.role && user.role !== payload.role) {
      throw new UnauthorizedException('Invalid role for this account');
    }
    return user;
  }
}
