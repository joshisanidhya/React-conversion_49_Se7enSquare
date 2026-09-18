import { ApiProperty } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsInt, Min } from 'class-validator';

export class SubmitQuizDto {
  @ApiProperty({ example: 4 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  userId!: number;

  @ApiProperty({
    example: [1, 0, 2, 1, 0],
    description: 'Zero-indexed selected option per question, in the order returned by GET /moderator-certification/quiz',
  })
  @IsArray()
  @ArrayMinSize(1)
  answers!: number[];
}
