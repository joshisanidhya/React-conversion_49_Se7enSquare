import { Controller, Get } from '@nestjs/common';
import { db } from '../common/utils/in-memory-db';

@Controller('users')
export class UsersController {

    @Get()
    showUsers() {
        let html = `
      <h2>User List</h2>
      <ul>
    `;

        db.users.forEach((user) => {
            html += `
        <li>
          ${user.id} - ${user.username} - ${user.email} - ${user.role}
        </li>
      `;
        });

        html += '</ul>';

        return html;
    }
}