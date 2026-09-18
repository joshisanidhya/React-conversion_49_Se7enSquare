import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class ReactMessageDto {
  @ApiPropertyOptional({ example: '👍' })
  @IsOptional()
  @IsString()
  @Length(1, 8)
  emoji?: string;

  @ApiPropertyOptional({ description: 'Who is reacting — used only to notify the message author', example: 5 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  actorId?: number;

  @ApiPropertyOptional({ example: 'player01' })
  @IsOptional()
  @IsString()
  @Length(1, 60)
  actorName?: string;
}
