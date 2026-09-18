import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsNotEmpty, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateMessageDto {
  @ApiProperty({ example: 'general' })
  @IsString()
  @Length(1, 60)
  channelId!: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  communityId?: number;

  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  authorId?: number;

  @ApiPropertyOptional({ example: 'player01' })
  @IsOptional()
  @IsString()
  @Length(1, 60)
  authorName?: string;

  @ApiProperty({ minLength: 1, maxLength: 2000, example: 'Anyone queueing ranked tonight?' })
  @IsString()
  @IsNotEmpty()
  @Length(1, 2000)
  content!: string;

  @ApiPropertyOptional({ type: [String], example: [] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  attachments?: string[];
}
