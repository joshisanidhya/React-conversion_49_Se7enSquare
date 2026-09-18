import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class CreateAppealDto {
  @ApiPropertyOptional({ example: 4 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId?: number;

  @ApiPropertyOptional({ example: 'ACT-DNX-2025-003847' })
  @IsOptional()
  @IsString()
  @Length(3, 60)
  actionId?: string;

  @ApiProperty({ minLength: 20, maxLength: 1000, example: 'I believe this action was taken in error because...' })
  @IsString()
  @Length(20, 1000)
  text!: string;

  @ApiProperty({ minLength: 1, maxLength: 100, example: 'I understand the action but disagree with it' })
  @IsString()
  @Length(1, 100)
  acknowledgement!: string;

  @ApiProperty({ minLength: 1, maxLength: 100, example: 'Reverse the action' })
  @IsString()
  @Length(1, 100)
  resolution!: string;

  @ApiPropertyOptional({ type: [String], example: ['evidence-1.png'] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(3)
  @IsString({ each: true })
  evidence?: string[];
}
