import { ApiProperty } from '@nestjs/swagger';

export class DashboardStatsDto {
  @ApiProperty({ example: 4 })
  totalUsers!: number;

  @ApiProperty({ example: 3 })
  totalCommunities!: number;

  @ApiProperty({ example: 5 })
  totalEvents!: number;

  @ApiProperty({ example: 2 })
  pendingReportsCount!: number;

  @ApiProperty({ example: 1 })
  pendingAppealsCount!: number;

  @ApiProperty({ example: 1 })
  pendingEventsCount!: number;

  @ApiProperty({ example: 4 })
  totalMemberships!: number;
}
