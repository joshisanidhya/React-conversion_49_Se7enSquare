import { Body, Controller, Get, Patch } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../rbac/role.enum';
import { UpdatePlatformConfigDto } from './dto/update-platform-config.dto';
import { PlatformConfigService } from './platform-config.service';

@ApiTags('platform-config')
@Controller('platform-config')
export class PlatformConfigController {
  constructor(private readonly service: PlatformConfigService) {}

  @Get()
  @Roles(AppRole.ADMIN, AppRole.COMMUNITY_MANAGER, AppRole.MODERATOR, AppRole.USER, AppRole.ORGANIZER)
  findOne() {
    return this.service.findOne();
  }

  @Patch()
  @Roles(AppRole.ADMIN)
  update(@Body() payload: UpdatePlatformConfigDto) {
    return this.service.update(payload);
  }
}
