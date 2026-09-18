import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBody,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiHeader,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../rbac/role.enum';
import { CommunitiesService } from './communities.service';
import { CommunityDto } from './dto/community.dto';
import { CreateCommunityDto } from './dto/create-community.dto';
import { UpdateCommunityDto } from './dto/update-community.dto';

@ApiTags('communities')
@ApiHeader({
  name: 'x-role',
  required: true,
  description:
    'RBAC role header. Accepted values: admin | community_manager | organizer | moderator | user. ' +
    'GET endpoints require any valid role. DELETE requires admin.',
  schema: { type: 'string', enum: ['admin', 'community_manager', 'organizer', 'moderator', 'user'] },
})
@Controller('communities')
export class CommunitiesController {
  constructor(private readonly communitiesService: CommunitiesService) {}

  @Get()
  @Roles(AppRole.ADMIN, AppRole.COMMUNITY_MANAGER, AppRole.MODERATOR, AppRole.USER, AppRole.ORGANIZER, AppRole.OWNER)
  @ApiOperation({
    summary: 'List all communities',
    description: 'Returns all communities including enriched UI fields (icon, category, slug, memberCount, onlineCount).',
  })
  @ApiOkResponse({ type: CommunityDto, isArray: true, description: 'Array of community records' })
  @ApiForbiddenResponse({ description: 'Missing or invalid x-role header' })
  findAll() {
    return this.communitiesService.findAll();
  }

  @Get(':id')
  @Roles(AppRole.ADMIN, AppRole.COMMUNITY_MANAGER, AppRole.MODERATOR, AppRole.USER, AppRole.ORGANIZER)
  @ApiOperation({
    summary: 'Get a single community by ID',
    description: 'Fetches one community by its numeric ID, including all display fields.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Numeric community ID' })
  @ApiOkResponse({ type: CommunityDto, description: 'The matching community record' })
  @ApiNotFoundResponse({ description: 'Community not found' })
  @ApiForbiddenResponse({ description: 'Missing or invalid x-role header' })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.communitiesService.findOne(id);
  }

  @Post()
  @Roles(AppRole.ADMIN, AppRole.COMMUNITY_MANAGER, AppRole.USER, AppRole.ORGANIZER)
  @ApiOperation({
    summary: 'Create a community',
    description: 'Creates a new community. Any authenticated role may create a community.',
  })
  @ApiBody({ type: CreateCommunityDto, description: 'Community creation payload (name, description, ownerId, tags)' })
  @ApiCreatedResponse({ type: CommunityDto, description: 'The newly created community' })
  @ApiForbiddenResponse({ description: 'Missing or invalid x-role header' })
  create(@Body() payload: CreateCommunityDto) {
    return this.communitiesService.create(payload);
  }

  @Patch(':id')
  @Roles(AppRole.ADMIN, AppRole.COMMUNITY_MANAGER, AppRole.USER, AppRole.ORGANIZER)
  @ApiOperation({
    summary: 'Update a community',
    description: 'Partially updates a community. All fields are optional.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Numeric community ID to update' })
  @ApiBody({ type: UpdateCommunityDto, description: 'Fields to update (all optional)' })
  @ApiOkResponse({ type: CommunityDto, description: 'The updated community record' })
  @ApiNotFoundResponse({ description: 'Community not found' })
  @ApiForbiddenResponse({ description: 'Missing or invalid x-role header' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() payload: UpdateCommunityDto,
  ) {
    return this.communitiesService.update(id, payload);
  }

  @Delete(':id')
  @Roles(AppRole.ADMIN, AppRole.COMMUNITY_MANAGER, AppRole.USER, AppRole.ORGANIZER)
  @ApiOperation({
    summary: 'Delete a community',
    description:
      'Permanently deletes a community and cascades to related memberships and events. Same trust model as ' +
      'create/update — any authenticated role may call this; the frontend is responsible for only showing the ' +
      'Delete action to the community owner or an admin, since there is no per-request user identity to enforce it server-side.',
  })
  @ApiParam({ name: 'id', type: Number, description: 'Numeric community ID to delete' })
  @ApiOkResponse({ schema: { example: { message: 'Community 3 deleted' } }, description: 'Deletion confirmation' })
  @ApiNotFoundResponse({ description: 'Community not found' })
  @ApiForbiddenResponse({ description: 'Missing or invalid x-role header' })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.communitiesService.remove(id);
  }
}
