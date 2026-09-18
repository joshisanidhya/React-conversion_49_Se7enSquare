import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Roles } from '../../common/decorators/roles.decorator';
import { AppRole } from '../rbac/role.enum';
import { AddMessageAttachmentDto } from './dto/add-message-attachment.dto';
import { CreateMessageDto } from './dto/create-message.dto';
import { ReactMessageDto } from './dto/react-message.dto';
import { MessagesService } from './messages.service';

@ApiTags('messages')
@Controller()
export class MessagesController {
  constructor(private readonly service: MessagesService) {}

  @Get('channels/:id/messages')
  @Roles(AppRole.ADMIN, AppRole.COMMUNITY_MANAGER, AppRole.MODERATOR, AppRole.USER, AppRole.ORGANIZER)
  findByChannel(@Param('id') channelId: string) {
    return this.service.findByChannel(channelId);
  }

  @Post('messages')
  @Roles(AppRole.ADMIN, AppRole.COMMUNITY_MANAGER, AppRole.MODERATOR, AppRole.USER, AppRole.ORGANIZER)
  create(@Body() payload: CreateMessageDto) {
    return this.service.create(payload);
  }

  @Post('messages/:id/reactions')
  @Roles(AppRole.ADMIN, AppRole.COMMUNITY_MANAGER, AppRole.MODERATOR, AppRole.USER, AppRole.ORGANIZER)
  react(@Param('id', ParseIntPipe) id: number, @Body() payload: ReactMessageDto) {
    return this.service.react(id, payload.emoji || '👍', payload.actorId, payload.actorName);
  }

  @Patch('messages/:id/pin')
  @Roles(AppRole.ADMIN, AppRole.COMMUNITY_MANAGER, AppRole.MODERATOR, AppRole.USER, AppRole.ORGANIZER)
  pin(@Param('id', ParseIntPipe) id: number) {
    return this.service.pin(id);
  }

  @Post('messages/:id/attachments')
  @Roles(AppRole.ADMIN, AppRole.COMMUNITY_MANAGER, AppRole.MODERATOR, AppRole.USER, AppRole.ORGANIZER)
  addAttachment(@Param('id', ParseIntPipe) id: number, @Body() payload: AddMessageAttachmentDto) {
    return this.service.addAttachment(id, payload.fileName || payload.url || 'attachment');
  }
}
