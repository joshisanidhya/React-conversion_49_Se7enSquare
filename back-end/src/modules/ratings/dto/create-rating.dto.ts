import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsIn, IsInt, IsOptional, IsString, Length, Max, Min } from 'class-validator';

export class CreateRatingDto {
  @ApiProperty({ example: 'organiser', enum: ['organiser', 'moderator'] })
  @IsIn(['organiser', 'moderator'])
  targetType!: 'organiser' | 'moderator';

  @ApiProperty({ example: 6 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  targetUserId!: number;

  @ApiProperty({ example: 4 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  raterId!: number;

  @ApiProperty({ example: 5, minimum: 1, maximum: 5 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(5)
  score!: number;

  @ApiPropertyOptional({ example: 'Ran a smooth, well-organized tournament.' })
  @IsOptional()
  @IsString()
  @Length(0, 300)
  comment?: string;
}
