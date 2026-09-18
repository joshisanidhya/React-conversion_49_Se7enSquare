import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, Length } from 'class-validator';

export class AddAppealEvidenceDto {
  @ApiPropertyOptional({ example: 'screenshot.png' })
  @IsOptional()
  @IsString()
  @Length(1, 200)
  fileName?: string;

  @ApiPropertyOptional({ example: '/uploads/1234-screenshot.png' })
  @IsOptional()
  @IsString()
  @Length(1, 300)
  url?: string;
}
