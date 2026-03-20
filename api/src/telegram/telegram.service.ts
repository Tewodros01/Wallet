import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';

type SendTelegramMessageOptions = {
  parseMode?: 'HTML' | 'MarkdownV2';
};

@Injectable()
export class TelegramService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  getBotToken() {
    return this.configService.get<string>('telegram.botToken');
  }

  async getUserTelegramStatus(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: {
        id: true,
        telegramId: true,
        telegramUsername: true,
        telegramPhotoUrl: true,
      },
    });
    if (!user) throw new UnauthorizedException('User not found');

    return {
      linked: Boolean(user.telegramId),
      telegramId: user.telegramId,
      telegramUsername: user.telegramUsername,
      telegramPhotoUrl: user.telegramPhotoUrl,
    };
  }

  async sendMessageToUser(
    userId: string,
    text: string,
    options?: SendTelegramMessageOptions,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId, deletedAt: null },
      select: { telegramId: true },
    });
    if (!user) throw new UnauthorizedException('User not found');
    if (!user.telegramId) {
      throw new BadRequestException('Telegram is not linked for this user');
    }

    return this.sendMessageToTelegramId(user.telegramId, text, options);
  }

  async sendMessageToTelegramId(
    telegramId: string,
    text: string,
    options?: SendTelegramMessageOptions,
  ) {
    const botToken = this.getBotToken();
    if (!botToken) {
      throw new InternalServerErrorException('Telegram bot is not configured');
    }

    const response = await fetch(
      `https://api.telegram.org/bot${botToken}/sendMessage`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chat_id: telegramId,
          text,
          parse_mode: options?.parseMode,
        }),
      },
    );

    if (!response.ok) {
      throw new BadRequestException('Failed to send Telegram message');
    }

    const payload = (await response.json()) as {
      ok?: boolean;
      result?: { message_id?: number };
    };
    if (!payload.ok) {
      throw new BadRequestException('Telegram Bot API rejected the message');
    }

    return { success: true, messageId: payload.result?.message_id ?? null };
  }

  async trySendMessageToUser(
    userId: string,
    text: string,
    options?: SendTelegramMessageOptions,
  ) {
    try {
      const status = await this.getUserTelegramStatus(userId);
      if (!status.linked || !status.telegramId) return { success: false };

      await this.sendMessageToTelegramId(status.telegramId, text, options);
      return { success: true };
    } catch {
      return { success: false };
    }
  }
}
