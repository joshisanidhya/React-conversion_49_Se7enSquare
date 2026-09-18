import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../rbac/role.enum';
import { AppealsService } from './appeals.service';
import { AddAppealEvidenceDto } from './dto/add-appeal-evidence.dto';
import { CreateAppealDto } from './dto/create-appeal.dto';
import { UpdateAppealStatusDto } from './dto/update-appeal-status.dto';

@ApiTags('appeals')
@Controller('appeals')
export class AppealsController {
  constructor(private readonly service: AppealsService) {}

  @Get()
  @Roles(AppRole.ADMIN, AppRole.MODERATOR)
  findAll() {
    return this.service.findAll();
  }

  @Post()
  @Roles(AppRole.ADMIN, AppRole.COMMUNITY_MANAGER, AppRole.MODERATOR, AppRole.USER, AppRole.ORGANIZER)
  create(@Body() payload: CreateAppealDto) {
    return this.service.create(payload);
  }

  @Post(':id/evidence')
  @Roles(AppRole.ADMIN, AppRole.COMMUNITY_MANAGER, AppRole.MODERATOR, AppRole.USER, AppRole.ORGANIZER)
  addEvidence(@Param('id', ParseIntPipe) id: number, @Body() payload: AddAppealEvidenceDto) {
    return this.service.addEvidence(id, payload);
  }

  @Patch(':id/status')
  @Roles(AppRole.ADMIN, AppRole.MODERATOR)
  updateStatus(@Param('id', ParseIntPipe) id: number, @Body() payload: UpdateAppealStatusDto) {
    return this.service.updateStatus(id, payload.status);
  }
}
