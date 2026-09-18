import { ApiProperty } from '@nestjs/swagger';

export class SubscriptionDto {
  @ApiProperty({ example: 'plus', enum: ['free', 'plus', 'ultra_pro'] })
  plan!: 'free' | 'plus' | 'ultra_pro';

  @ApiProperty({ example: 'active', enum: ['active', 'cancelled'] })
  status!: 'active' | 'cancelled';

  @ApiProperty({ example: '2026-05-01T09:00:00.000Z', required: false })
  startedAt?: string;
}
