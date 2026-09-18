import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class UpdateOrganiserStatusDto {
  @ApiProperty({ example: 'verified', enum: ['verified', 'rejected'] })
  @IsIn(['verified', 'rejected'])
  status!: 'verified' | 'rejected';
}
