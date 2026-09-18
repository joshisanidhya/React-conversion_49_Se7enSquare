import { Controller, Get, Query } from '@nestjs/common';
import { ApiHeader, ApiOkResponse, ApiOperation, ApiQuery, ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../rbac/role.enum';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@ApiHeader({
  name: 'x-role',
  required: true,
  description: 'RBAC role header. /history is open to any authenticated role (scoped to their own userId). /summary requires owner or admin.',
})
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Get('history')
  @Roles(AppRole.ADMIN, AppRole.OWNER, AppRole.COMMUNITY_MANAGER, AppRole.ORGANIZER, AppRole.MODERATOR, AppRole.USER)
  @ApiOperation({ summary: "Get a user's payment history", description: 'Simulated ledger entries — no real payment gateway is involved.' })
  @ApiQuery({ name: 'userId', required: false, description: 'Filter to one user; omitted returns everything (admin/owner use).' })
  @ApiOkResponse({ description: 'Array of payment records' })
  history(@Query('userId') userId?: string) {
    return this.paymentsService.history(userId ? Number(userId) : undefined);
  }

  @Get('summary')
  @Roles(AppRole.ADMIN, AppRole.OWNER)
  @ApiOperation({ summary: 'Get aggregate revenue summary', description: 'Totals by type/month — feeds the Owner revenue dashboard.' })
  @ApiOkResponse({ description: 'Revenue summary totals' })
  summary() {
    return this.paymentsService.summary();
  }
}
