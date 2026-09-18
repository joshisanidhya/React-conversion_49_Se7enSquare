import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, Min } from 'class-validator';

export class UpgradeOrganiserPlanDto {
  @ApiProperty({ example: 6 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId!: number;

  @ApiProperty({ example: 'premium', enum: ['free', 'premium'] })
  @IsIn(['free', 'premium'])
  plan!: 'free' | 'premium';
}
