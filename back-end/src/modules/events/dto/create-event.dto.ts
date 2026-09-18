import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsDateString,
  IsInt,
  IsOptional,
  IsString,
  Length,
  Min,
} from 'class-validator';

export class CreateEventDto {
  @ApiProperty({ minLength: 3, maxLength: 60, example: 'Clan Tournament Qualifier' })
  @IsString()
  @Length(3, 60)
  title!: string;

  @ApiProperty({ minLength: 10, maxLength: 220, example: 'Qualifier round for monthly tournament' })
  @IsString()
  @Length(10, 220)
  description!: string;

  @ApiProperty({ example: 1 })
  @Type(() => Number)
  @IsInt()
  @Min(1)
  communityId!: number;

  @ApiProperty({ example: '2026-05-20' })
  @IsString()
  date!: string;

  @ApiPropertyOptional({ example: '6:00 PM' })
  @IsOptional()
  @IsString()
  time?: string;

  @ApiPropertyOptional({ example: 'tournament', enum: ['tournament', 'hackathon', 'workshop', 'meetup', 'watchparty'] })
  @IsOptional()
  @IsString()
  type?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  attendees?: number;

  @ApiPropertyOptional({ example: 100 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  maxAttendees?: number;

  @ApiPropertyOptional({ example: 'pending', enum: ['pending', 'approved', 'rejected', 'cancelled'] })
  @IsOptional()
  @IsString()
  status?: string;

  @ApiPropertyOptional({ example: 'Rajat' })
  @IsOptional()
  @IsString()
  createdBy?: string;

  @ApiPropertyOptional({ example: 6, description: "Links to the organiser's user id — used for organizer-plan limit checks (createdBy is just a display string)" })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  organiserId?: number;

  @ApiPropertyOptional({ example: 100, description: '₹ per player — doc §16 revenue sharing. 0/omitted means a free event.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  entryFee?: number;

  @ApiPropertyOptional({ example: 30000, description: '₹ displayed to players — set directly by the organiser, not auto-derived from entryFee.' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  prizePool?: number;

  @ApiPropertyOptional({ example: 'Esports' })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({ example: 'data:image/png;base64,...' })
  @IsOptional()
  @IsString()
  coverImage?: string;
}

