import { Injectable, InternalServerErrorException, Optional } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from './notifications.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    private readonly prisma: PrismaService,
    @Optional() private readonly gateway?: NotificationsGateway,
  ) {}

  async getAll(userId: string) {
    return this.prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });
  }

  async getUnreadCount(userId: string) {
    const count = await this.prisma.notification.count({
      where: { userId, read: false },
    });
    return { count };
  }

  async markRead(id: string, userId: string) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { read: true },
    });
  }

  async markAllRead(userId: string) {
    try {
      await this.prisma.notification.updateMany({
        where: { userId, read: false },
        data: { read: true },
      });
      return { success: true };
    } catch {
      throw new InternalServerErrorException('Failed to mark notifications as read');
    }
  }

  async deleteOne(id: string, userId: string) {
    await this.prisma.notification.deleteMany({ where: { id, userId } });
    return { success: true };
  }

  /** Create a notification and immediately push it to the user via WebSocket */
  async createAndPush(data: {
    userId: string;
    type: string;
    title: string;
    body: string;
  }) {
    const notification = await this.prisma.notification.create({ data: data as any });
    this.gateway?.pushToUser(data.userId, notification);
    return notification;
  }
}
