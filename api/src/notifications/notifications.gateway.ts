import { Logger } from '@nestjs/common';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  namespace: '/notifications',
  cors: { origin: '*', credentials: true },
})
export class NotificationsGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server;

  private readonly logger = new Logger(NotificationsGateway.name);
  // userId → Set of socket ids
  private readonly userSockets = new Map<string, Set<string>>();

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  afterInit() {
    this.logger.log('🔔 NotificationsGateway initialised');
  }

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.headers?.authorization as string)?.replace('Bearer ', '');

      if (!token) { client.disconnect(); return; }

      const payload = this.jwtService.verify<{ sub: string }>(token, {
        secret: this.config.get<string>('JWT_SECRET'),
      });

      const userId = payload.sub;
      client.data.userId = userId;

      if (!this.userSockets.has(userId)) this.userSockets.set(userId, new Set());
      this.userSockets.get(userId)!.add(client.id);

      this.logger.log(`🔔 Connected: ${client.id} (user ${userId})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    const userId = client.data?.userId as string | undefined;
    if (userId) {
      this.userSockets.get(userId)?.delete(client.id);
      if (this.userSockets.get(userId)?.size === 0) this.userSockets.delete(userId);
    }
    this.logger.log(`🔔 Disconnected: ${client.id}`);
  }

  /** Push a notification to a specific user across all their connected devices */
  pushToUser(userId: string, notification: object) {
    const sockets = this.userSockets.get(userId);
    if (!sockets || sockets.size === 0) return;
    this.server.to([...sockets]).emit('notification:new', notification);
  }
}
