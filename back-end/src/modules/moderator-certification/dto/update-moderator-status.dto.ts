import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateModeratorStatusDto {
  @ApiProperty({ example: 'certified', enum: ['certified', 'rejected'] })
  @IsIn(['certified', 'rejected'])
  status!: 'certified' | 'rejected';
}
