import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class CreateAuditDto {
  @ApiProperty({ minLength: 3, maxLength: 100, example: 'Community Created' })
  @IsString()
  @Length(3, 100)
  action!: string;

  @ApiProperty({ minLength: 1, maxLength: 60, example: 'admin01' })
  @IsString()
  @Length(1, 60)
  actor!: string;

  @ApiPropertyOptional({ example: 'FPS Arena' })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  target?: string;

  @ApiPropertyOptional({ example: 'Seed community' })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  reason?: string;
}
