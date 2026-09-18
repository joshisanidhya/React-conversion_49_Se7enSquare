import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CommunityDto {
  @ApiProperty({ example: 1, description: 'Unique community ID' })
  id!: number;

  @ApiProperty({ example: 'FPS Arena', description: 'Community display name' })
  name!: string;

  @ApiProperty({ example: 'Competitive FPS players and tournaments', description: 'Community description (10–200 chars)' })
  description!: string;

  @ApiProperty({ example: 3, description: 'User ID of the community owner' })
  ownerId!: number;

  @ApiProperty({ example: ['fps', 'esports'], type: [String], description: 'Topic tags (1–5 tags)' })
  tags!: string[];

  @ApiPropertyOptional({
    example: ['general', { name: 'announcements', type: 'Announcement' }],
    description: 'Community channels as names or channel objects',
  })
  channels?: Array<string | { id?: string; name: string; type?: string }>;

  @ApiPropertyOptional({ example: '⚡', description: 'Emoji icon shown in the UI' })
  icon?: string;

  @ApiPropertyOptional({ example: 'Gaming', description: 'Category label shown in discovery page' })
  category?: string;

  @ApiPropertyOptional({ example: 'fps-arena', description: 'URL-friendly slug for routing' })
  slug?: string;

  @ApiPropertyOptional({ example: 12400, description: 'Total member count' })
  memberCount?: number;

  @ApiPropertyOptional({ example: 842, description: 'Members currently online' })
  onlineCount?: number;
}
