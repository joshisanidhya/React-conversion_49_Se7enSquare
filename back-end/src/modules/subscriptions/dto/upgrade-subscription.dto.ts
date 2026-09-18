import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, Min } from 'class-validator';

export class UpgradeSubscriptionDto {
  @ApiProperty({ example: 4 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId!: number;

  @ApiProperty({ example: 'plus', enum: ['free', 'plus', 'ultra_pro'] })
  @IsIn(['free', 'plus', 'ultra_pro'])
  plan!: 'free' | 'plus' | 'ultra_pro';
}
