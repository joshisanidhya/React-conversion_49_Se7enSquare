import { Body, Controller, Delete, Get, Param, ParseIntPipe, Post } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOkResponse, ApiOperation, ApiParam, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../rbac/role.enum';
import { CreateFeaturedEventDto } from './dto/create-featured-event.dto';
import { FeaturedEventsService } from './featured-events.service';

@ApiTags('featured-events')
@ApiHeader({
  name: 'x-role',
  required: true,
  description: 'RBAC role header. GET is open to any role (Discover page). POST requires organizer | community_manager | admin. DELETE requires admin.',
})
@Controller('featured-events')
export class FeaturedEventsController {
  constructor(private readonly featuredEventsService: FeaturedEventsService) {}

  @Get()
  @Roles(AppRole.ADMIN, AppRole.OWNER, AppRole.COMMUNITY_MANAGER, AppRole.ORGANIZER, AppRole.MODERATOR, AppRole.USER)
  @ApiOperation({ summary: 'List currently-active featured (promoted) events', description: 'Powers the Discover page carousel — each entry includes the joined event record.' })
  @ApiOkResponse({ description: 'Array of active featured-event records with their event data' })
  findAll() {
    return this.featuredEventsService.findAll();
  }

  @Post()
  @Roles(AppRole.ADMIN, AppRole.COMMUNITY_MANAGER, AppRole.ORGANIZER)
  @ApiOperation({ summary: 'Promote an event to the Discover carousel', description: 'Simulated pay-to-promote purchase — logs a payment.' })
  @ApiBody({ type: CreateFeaturedEventDto })
  create(@Body() payload: CreateFeaturedEventDto) {
    return this.featuredEventsService.create(payload.eventId, payload.userId, payload.durationDays);
  }

  @Delete(':id')
  @Roles(AppRole.ADMIN)
  @ApiOperation({ summary: 'Remove a featured-event promotion' })
  @ApiParam({ name: 'id', type: Number })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.featuredEventsService.remove(id);
  }
}
