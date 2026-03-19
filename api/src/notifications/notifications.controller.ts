import {
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../auth/decorators/get-user.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { NotificationsService } from './notifications.service';

@ApiTags('notifications')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @ApiOperation({ summary: 'Get all notifications' })
  @Get()
  getAll(@GetUser('sub') userId: string) {
    return this.notificationsService.getAll(userId);
  }

  @ApiOperation({ summary: 'Get unread count' })
  @Get('unread-count')
  getUnreadCount(@GetUser('sub') userId: string) {
    return this.notificationsService.getUnreadCount(userId);
  }

  @ApiOperation({ summary: 'Mark all as read' })
  @Patch('read-all')
  markAllRead(@GetUser('sub') userId: string) {
    return this.notificationsService.markAllRead(userId);
  }

  @ApiOperation({ summary: 'Mark one as read' })
  @Patch(':id/read')
  markRead(@Param('id') id: string, @GetUser('sub') userId: string) {
    return this.notificationsService.markRead(id, userId);
  }

  @ApiOperation({ summary: 'Delete a notification' })
  @Delete(':id')
  deleteOne(@Param('id') id: string, @GetUser('sub') userId: string) {
    return this.notificationsService.deleteOne(id, userId);
  }
}
