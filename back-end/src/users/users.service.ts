import { Injectable } from "@nestjs/common";
import { db } from "../common/utils/in-memory-db";
@Injectable()
export class UsersService {
    getAllUsers() {
        return db.users;
    }
}