import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, IsString, Length, Min } from 'class-validator';

export class ApplyOrganiserDto {
  @ApiProperty({ example: 4 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId!: number;

  @ApiPropertyOptional({ example: 'Ran 3 campus BGMI tournaments in the last year.' })
  @IsOptional()
  @IsString()
  @Length(0, 400)
  experienceNote?: string;
}
