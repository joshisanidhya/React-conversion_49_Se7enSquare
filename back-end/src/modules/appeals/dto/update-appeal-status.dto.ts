import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateAppealStatusDto {
  @ApiProperty({ enum: ['pending', 'reviewed', 'approved', 'rejected'], example: 'approved' })
  @IsIn(['pending', 'reviewed', 'approved', 'rejected'])
  status!: 'pending' | 'reviewed' | 'approved' | 'rejected';
}
