import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOkResponse, ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../rbac/role.enum';
import { OrganiserStatus } from '../../common/utils/in-memory-db';
import { ApplyOrganiserDto } from './dto/apply-organiser.dto';
import { UpdateOrganiserStatusDto } from './dto/update-organiser-status.dto';
import { UpgradeOrganiserPlanDto } from './dto/upgrade-organiser-plan.dto';
import { OrganisersService } from './organisers.service';

@ApiTags('organisers')
@ApiHeader({
  name: 'x-role',
  required: true,
  description:
    'RBAC role header. apply/profile/analytics/subscription-upgrade: user | organizer | admin. ' +
    'PATCH :id (verify/reject) requires admin only.',
})
@Controller('organisers')
export class OrganisersController {
  constructor(private readonly organisersService: OrganisersService) {}

  @Get()
  @Roles(AppRole.ADMIN, AppRole.OWNER)
  @ApiOperation({ summary: 'List all organiser applications', description: 'Admin (approval queue) / Owner (read-only stats drill-down).' })
  @ApiQuery({ name: 'status', required: false, enum: ['pending', 'verified', 'rejected'] })
  findAll(@Query('status') status?: OrganiserStatus) {
    return this.organisersService.findAll(status);
  }

  @Post('apply')
  @Roles(AppRole.USER, AppRole.ORGANIZER, AppRole.ADMIN)
  @ApiOperation({ summary: 'Apply to become a Verified Organizer', description: 'Creates a pending application. Does not itself grant the organizer role — see PATCH /:id.' })
  @ApiBody({ type: ApplyOrganiserDto })
  apply(@Body() payload: ApplyOrganiserDto) {
    return this.organisersService.apply(payload.userId, payload.experienceNote);
  }

  @Patch(':id')
  @Roles(AppRole.ADMIN)
  @ApiOperation({ summary: 'Verify or reject an organiser application', description: 'Admin-only. On verification, also flips the applicant\'s account role to organizer.' })
  @ApiParam({ name: 'id', type: Number })
  @ApiBody({ type: UpdateOrganiserStatusDto })
  setStatus(@Param('id', ParseIntPipe) id: number, @Body() payload: UpdateOrganiserStatusDto) {
    return this.organisersService.setStatus(id, payload.status);
  }

  @Get('profile')
  @Roles(AppRole.USER, AppRole.ORGANIZER, AppRole.ADMIN)
  @ApiOperation({ summary: "Get a user's organiser application/plan status" })
  @ApiQuery({ name: 'userId', required: true, example: 6 })
  @ApiOkResponse({ description: 'Application status, plan, and plan limits' })
  profile(@Query('userId') userId: string) {
    return this.organisersService.profile(Number(userId));
  }

  @Get('analytics')
  @Roles(AppRole.ORGANIZER, AppRole.ADMIN)
  @ApiOperation({ summary: "Get an organiser's tournament analytics", description: 'Aggregates their own events/registrations — same scoping as the Organizer Dashboard.' })
  @ApiQuery({ name: 'userId', required: true, example: 6 })
  analytics(@Query('userId') userId: string) {
    return this.organisersService.analytics(Number(userId));
  }

  @Post('subscription/upgrade')
  @Roles(AppRole.ORGANIZER, AppRole.ADMIN)
  @ApiOperation({ summary: 'Upgrade the organiser subscription tier', description: 'Free Organizer → Premium Organizer. Logs a simulated payment.' })
  @ApiBody({ type: UpgradeOrganiserPlanDto })
  upgradePlan(@Body() payload: UpgradeOrganiserPlanDto) {
    return this.organisersService.upgradePlan(payload.userId, payload.plan);
  }
}
