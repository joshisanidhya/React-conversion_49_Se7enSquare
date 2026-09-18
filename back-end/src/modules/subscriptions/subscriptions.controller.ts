import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiBody, ApiHeader, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../rbac/role.enum';
import { CancelSubscriptionDto } from './dto/cancel-subscription.dto';
import { SubscriptionDto } from './dto/subscription.dto';
import { UpgradeSubscriptionDto } from './dto/upgrade-subscription.dto';
import { SubscriptionsService } from './subscriptions.service';

const SUBSCRIBER_ROLES = [
  AppRole.ADMIN,
  AppRole.COMMUNITY_MANAGER,
  AppRole.ORGANIZER,
  AppRole.MODERATOR,
  AppRole.USER,
];

@ApiTags('subscriptions')
@ApiHeader({ name: 'x-role', required: true, description: 'RBAC role header. Any non-owner role may manage its own subscription.' })
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get()
  @Roles(AppRole.ADMIN, AppRole.OWNER)
  @ApiOperation({ summary: 'Breakdown of active subscriptions by plan, plus the list of current premium subscribers', description: 'Admin/Owner only — powers the Owner dashboard\'s Subscriptions drill-down.' })
  findAll() {
    return this.subscriptionsService.findAll();
  }

  @Get('status')
  @Roles(...SUBSCRIBER_ROLES)
  @ApiOperation({ summary: 'Get a user\'s current subscription plan', description: 'Defaults to the free plan if the user has never subscribed.' })
  @ApiQuery({ name: 'userId', required: true, example: 4 })
  @ApiOkResponse({ type: SubscriptionDto })
  status(@Query('userId') userId: string) {
    return this.subscriptionsService.status(Number(userId));
  }

  @Post('upgrade')
  @Roles(...SUBSCRIBER_ROLES)
  @ApiOperation({ summary: 'Upgrade (or change) a subscription plan', description: 'Free → Plus → Ultra Pro. Logs a simulated payment for paid plans.' })
  @ApiBody({ type: UpgradeSubscriptionDto })
  @ApiOkResponse({ description: 'The new active subscription record' })
  upgrade(@Body() payload: UpgradeSubscriptionDto) {
    return this.subscriptionsService.upgrade(payload.userId, payload.plan);
  }

  @Post('cancel')
  @Roles(...SUBSCRIBER_ROLES)
  @ApiOperation({ summary: 'Cancel a subscription', description: 'Reverts the user to the free plan.' })
  @ApiBody({ type: CancelSubscriptionDto })
  @ApiOkResponse({ schema: { example: { message: 'Subscription for user 4 reverted to free plan' } } })
  cancel(@Body() payload: CancelSubscriptionDto) {
    return this.subscriptionsService.cancel(payload.userId);
  }
}
