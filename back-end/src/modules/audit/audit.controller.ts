import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../rbac/role.enum';
import { AuditService } from './audit.service';
import { CreateAuditDto } from './dto/create-audit.dto';

@ApiTags('audit-log')
@Controller('audit-log')
export class AuditController {
  constructor(private readonly service: AuditService) {}

  @Get()
  @Roles(AppRole.ADMIN, AppRole.MODERATOR)
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @Roles(AppRole.ADMIN, AppRole.MODERATOR)
  create(@Body() payload: CreateAuditDto) {
    return this.service.create(payload);
  }
}
