import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, Min } from 'class-validator';

export class CreateMembershipDto {
  @ApiProperty({ example: 3, description: 'ID of the user joining the community' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId!: number;

  @ApiProperty({ example: 1, description: 'ID of the community to join' })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  communityId!: number;
}
