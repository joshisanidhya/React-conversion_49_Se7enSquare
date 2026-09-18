import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../rbac/role.enum';
import { RatingTargetType } from '../../common/utils/in-memory-db';
import { CreateRatingDto } from './dto/create-rating.dto';
import { RatingsService } from './ratings.service';

@ApiTags('ratings')
@ApiHeader({ name: 'x-role', required: true, description: 'RBAC role header. Any authenticated role may rate an organiser/moderator they interacted with.' })
@Controller('ratings')
export class RatingsController {
  constructor(private readonly ratingsService: RatingsService) {}

  @Post()
  @Roles(AppRole.ADMIN, AppRole.COMMUNITY_MANAGER, AppRole.ORGANIZER, AppRole.MODERATOR, AppRole.USER)
  @ApiOperation({ summary: 'Rate an organiser or moderator', description: 'Doc §13 — player ratings feed the organiser/moderator trust score.' })
  @ApiBody({ type: CreateRatingDto })
  create(@Body() payload: CreateRatingDto) {
    return this.ratingsService.create(payload.targetType, payload.targetUserId, payload.raterId, payload.score, payload.comment);
  }

  @Get()
  @Roles(AppRole.ADMIN, AppRole.COMMUNITY_MANAGER, AppRole.ORGANIZER, AppRole.MODERATOR, AppRole.USER)
  @ApiOperation({ summary: 'Get ratings + average for an organiser or moderator' })
  @ApiQuery({ name: 'targetType', enum: ['organiser', 'moderator'], required: true })
  @ApiQuery({ name: 'targetUserId', required: true, example: 6 })
  @ApiOkResponse({ description: 'Average score, count, and the individual rating records' })
  forTarget(@Query('targetType') targetType: RatingTargetType, @Query('targetUserId') targetUserId: string) {
    return this.ratingsService.forTarget(targetType, Number(targetUserId));
  }
}
