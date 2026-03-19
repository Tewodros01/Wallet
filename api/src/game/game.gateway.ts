import { Logger, UseGuards } from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Server, Socket } from 'socket.io';
import { PrismaService } from '../prisma/prisma.service';
import { RoomsService } from '../rooms/rooms.service';
import { GameSpeed, RoomStatus } from 'generated/prisma/client';

// ── Speed → interval ms ──────────────────────────────────────────────────────
const SPEED_INTERVAL: Record<GameSpeed, number> = {
  SLOW:   6000,
  NORMAL: 4000,
  FAST:   2000,
};

// ── In-memory game state per room ────────────────────────────────────────────
interface RoomState {
  calledNums: number[];
  remaining:  number[];
  intervalId: NodeJS.Timeout | null;
  speed:      GameSpeed;
}

@WebSocketGateway({
  namespace: '/game',
  cors: { origin: '*', credentials: true },
})
export class GameGateway
  implements OnGatewayInit, OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer() server!: Server;

  private readonly logger   = new Logger(GameGateway.name);
  private readonly rooms    = new Map<string, RoomState>();
  // socket.id → userId
  private readonly userMap  = new Map<string, string>();

  constructor(
    private readonly prisma:       PrismaService,
    private readonly roomsService: RoomsService,
    private readonly jwtService:   JwtService,
    private readonly config:       ConfigService,
  ) {}

  afterInit() {
    this.logger.log('🎮 GameGateway initialised');
  }

  // ── Connection / auth ──────────────────────────────────────────────────────

  async handleConnection(client: Socket) {
    try {
      const token =
        (client.handshake.auth?.token as string) ||
        (client.handshake.headers?.authorization as string)?.replace('Bearer ', '');

      if (!token) { client.disconnect(); return; }

      const payload = this.jwtService.verify<{ sub: string }>(token, {
        secret: this.config.get<string>('JWT_SECRET'),
      });

      this.userMap.set(client.id, payload.sub);
      this.logger.log(`✅ Connected: ${client.id} (user ${payload.sub})`);
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.userMap.delete(client.id);
    this.logger.log(`❌ Disconnected: ${client.id}`);
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private getUserId(client: Socket): string {
    const uid = this.userMap.get(client.id);
    if (!uid) throw new WsException('Unauthorized');
    return uid;
  }

  private buildRemaining(called: number[]): number[] {
    const set = new Set(called);
    return Array.from({ length: 75 }, (_, i) => i + 1).filter((n) => !set.has(n));
  }

  // ── Events ─────────────────────────────────────────────────────────────────

  /** Player joins a socket room to receive live updates */
  @SubscribeMessage('room:join')
  async onRoomJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ) {
    const userId = this.getUserId(client);
    const { roomId } = payload;

    // verify player is in the DB room
    const player = await this.prisma.roomPlayer.findUnique({
      where: { roomId_userId: { roomId, userId } },
      include: { card: true },
    });
    if (!player) throw new WsException('Not a member of this room');

    await client.join(roomId);

    // send current game state if game is already running
    const state = this.rooms.get(roomId);
    if (state) {
      client.emit('game:state', {
        calledNums: state.calledNums,
        current:    state.calledNums.at(-1) ?? null,
        remaining:  state.remaining.length,
      });
    }

    // send player their card
    client.emit('player:card', { card: player.card });

    // notify room
    this.server.to(roomId).emit('room:player_joined', { userId, count: await this.prisma.roomPlayer.count({ where: { roomId } }) });

    this.logger.log(`User ${userId} joined socket room ${roomId}`);
    return { success: true };
  }

  /** Host starts the auto-caller */
  @SubscribeMessage('game:start')
  async onGameStart(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ) {
    const userId = this.getUserId(client);
    const { roomId } = payload;

    const room = await this.prisma.gameRoom.findUnique({ where: { id: roomId } });
    if (!room) throw new WsException('Room not found');
    if (room.hostId !== userId) throw new WsException('Only the host can start');
    if (room.status !== RoomStatus.WAITING) throw new WsException('Game already started');

    // persist status change
    await this.roomsService.startGame(roomId, userId);

    // init in-memory state
    const state: RoomState = {
      calledNums: [],
      remaining:  this.buildRemaining([]),
      intervalId: null,
      speed:      room.speed,
    };
    this.rooms.set(roomId, state);

    this.server.to(roomId).emit('game:started', { roomId, speed: room.speed });

    // begin auto-calling
    this.startAutoCaller(roomId, state);

    return { success: true };
  }

  /** Host manually calls next number (overrides auto-caller) */
  @SubscribeMessage('game:call_next')
  async onCallNext(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ) {
    const userId = this.getUserId(client);
    const { roomId } = payload;

    const room = await this.prisma.gameRoom.findUnique({ where: { id: roomId } });
    if (!room || room.hostId !== userId) throw new WsException('Unauthorized');

    await this.callNextNumber(roomId);
    return { success: true };
  }

  /** Player marks a number on their card */
  @SubscribeMessage('player:mark')
  async onPlayerMark(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; number: number },
  ) {
    const userId = this.getUserId(client);
    const { roomId, number } = payload;

    const state = this.rooms.get(roomId);
    if (!state || !state.calledNums.includes(number)) {
      throw new WsException('Number has not been called');
    }

    const player = await this.prisma.roomPlayer.findUnique({
      where: { roomId_userId: { roomId, userId } },
    });
    if (!player) throw new WsException('Not in room');

    const marked: number[] = Array.isArray(player.markedNums) ? (player.markedNums as number[]) : [];
    if (!marked.includes(number)) {
      marked.push(number);
      await this.prisma.roomPlayer.update({
        where: { roomId_userId: { roomId, userId } },
        data: { markedNums: marked },
      });
    }

    client.emit('player:marked', { number, markedNums: marked });
    return { success: true };
  }

  /** Player claims BINGO */
  @SubscribeMessage('game:bingo')
  async onBingoClaim(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ) {
    const userId = this.getUserId(client);
    const { roomId } = payload;

    const state = this.rooms.get(roomId);
    if (!state) throw new WsException('Game not active');

    // validate win on server side
    const player = await this.prisma.roomPlayer.findUnique({
      where: { roomId_userId: { roomId, userId } },
      include: { card: true },
    });
    if (!player || !player.card) throw new WsException('Player not found');

    const board   = player.card.board as number[][];
    const marked  = new Set<number>(Array.isArray(player.markedNums) ? (player.markedNums as number[]) : []);
    marked.add(0); // free space

    if (!this.checkWin(board, marked, new Set(state.calledNums))) {
      throw new WsException('No valid BINGO pattern detected');
    }

    // stop auto-caller
    this.stopAutoCaller(roomId);

    // persist win
    const result = await this.roomsService.claimBingo(roomId, userId);

    // broadcast to all in room
    this.server.to(roomId).emit('game:winner', {
      userId,
      prize:      result.prize,
      calledNums: state.calledNums,
    });

    this.rooms.delete(roomId);
    return { success: true, prize: result.prize };
  }

  /** Host pauses the auto-caller */
  @SubscribeMessage('game:pause')
  async onPause(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ) {
    const userId = this.getUserId(client);
    const room   = await this.prisma.gameRoom.findUnique({ where: { id: payload.roomId } });
    if (!room || room.hostId !== userId) throw new WsException('Unauthorized');

    this.stopAutoCaller(payload.roomId);
    this.server.to(payload.roomId).emit('game:paused');
    return { success: true };
  }

  /** Host resumes the auto-caller */
  @SubscribeMessage('game:resume')
  async onResume(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ) {
    const userId = this.getUserId(client);
    const room   = await this.prisma.gameRoom.findUnique({ where: { id: payload.roomId } });
    if (!room || room.hostId !== userId) throw new WsException('Unauthorized');

    const state = this.rooms.get(payload.roomId);
    if (!state) throw new WsException('Game state not found');

    this.startAutoCaller(payload.roomId, state);
    this.server.to(payload.roomId).emit('game:resumed');
    return { success: true };
  }

  /** Spectator joins a room to watch without playing */
  @SubscribeMessage('spectator:join')
  async onSpectatorJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ) {
    const userId = this.getUserId(client);
    const { roomId } = payload;

    const room = await this.prisma.gameRoom.findUnique({ where: { id: roomId } });
    if (!room) throw new WsException('Room not found');

    // spectators join a separate sub-room so we can track them
    await client.join(`spectator:${roomId}`);
    await client.join(roomId); // also join main room to receive game events

    const state = this.rooms.get(roomId);
    if (state) {
      client.emit('game:state', {
        calledNums: state.calledNums,
        current: state.calledNums.at(-1) ?? null,
        remaining: state.remaining.length,
      });
    }

    const spectatorCount = (await this.server.in(`spectator:${roomId}`).fetchSockets()).length;
    this.server.to(roomId).emit('room:spectator_joined', { userId, spectatorCount });

    this.logger.log(`Spectator ${userId} joined room ${roomId}`);
    return { success: true, spectator: true };
  }

  /** Spectator leaves */
  @SubscribeMessage('spectator:leave')
  async onSpectatorLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ) {
    const userId = this.getUserId(client);
    const { roomId } = payload;
    await client.leave(`spectator:${roomId}`);
    await client.leave(roomId);
    const spectatorCount = (await this.server.in(`spectator:${roomId}`).fetchSockets()).length;
    this.server.to(roomId).emit('room:spectator_left', { userId, spectatorCount });
    return { success: true };
  }

  /** Player sends a chat message in a room */
  @SubscribeMessage('chat:send')
  async onChatSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; message: string },
  ) {
    const userId = this.getUserId(client);
    const { roomId, message } = payload;

    if (!message?.trim() || message.length > 200) {
      throw new WsException('Invalid message');
    }

    // verify user is in the room
    const player = await this.prisma.roomPlayer.findUnique({
      where: { roomId_userId: { roomId, userId } },
      include: { user: { select: { id: true, username: true, avatar: true } } },
    });
    if (!player) throw new WsException('Not a member of this room');

    const chatMsg = {
      id: `${Date.now()}-${userId.slice(-4)}`,
      userId,
      username: player.user.username,
      avatar: player.user.avatar,
      message: message.trim(),
      sentAt: new Date().toISOString(),
    };

    // broadcast to everyone in the room including sender
    this.server.to(roomId).emit('chat:message', chatMsg);
    return { success: true };
  }

  /** Get live room state */
  @SubscribeMessage('room:state')
  async onRoomState(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ) {
    const { roomId } = payload;
    const state = this.rooms.get(roomId);
    const room  = await this.prisma.gameRoom.findUnique({
      where: { id: roomId },
      include: {
        players: {
          include: { user: { select: { id: true, username: true, avatar: true } } },
        },
        rounds: { orderBy: { createdAt: 'desc' }, take: 1 },
        _count: { select: { players: true } },
      },
    });

    return {
      room,
      calledNums: state?.calledNums ?? [],
      remaining:  state?.remaining.length ?? 75,
    };
  }

  // ── Auto-caller ────────────────────────────────────────────────────────────

  private startAutoCaller(roomId: string, state: RoomState) {
    if (state.intervalId) clearInterval(state.intervalId);

    state.intervalId = setInterval(async () => {
      if (state.remaining.length === 0) {
        this.stopAutoCaller(roomId);
        this.server.to(roomId).emit('game:all_called');
        return;
      }
      await this.callNextNumber(roomId);
    }, SPEED_INTERVAL[state.speed]);
  }

  private stopAutoCaller(roomId: string) {
    const state = this.rooms.get(roomId);
    if (state?.intervalId) {
      clearInterval(state.intervalId);
      state.intervalId = null;
    }
  }

  private async callNextNumber(roomId: string) {
    const state = this.rooms.get(roomId);
    if (!state || state.remaining.length === 0) return;

    // pick random from remaining
    const idx    = Math.floor(Math.random() * state.remaining.length);
    const number = state.remaining[idx];

    state.remaining.splice(idx, 1);
    state.calledNums.push(number);

    // persist to DB
    await this.prisma.gameRound.updateMany({
      where: { roomId },
      data:  { calledNums: state.calledNums, currentNum: number },
    });

    // broadcast
    this.server.to(roomId).emit('game:number_called', {
      number,
      calledNums: state.calledNums,
      remaining:  state.remaining.length,
    });
  }

  // ── Win detection ──────────────────────────────────────────────────────────

  private checkWin(
    board:   number[][],
    marked:  Set<number>,
    called:  Set<number>,
  ): boolean {
    const isMarked = (r: number, c: number) => {
      const n = board[r][c];
      return n === 0 || (marked.has(n) && called.has(n));
    };

    // rows
    for (let r = 0; r < 5; r++) {
      if ([0,1,2,3,4].every((c) => isMarked(r, c))) return true;
    }
    // cols
    for (let c = 0; c < 5; c++) {
      if ([0,1,2,3,4].every((r) => isMarked(r, c))) return true;
    }
    // diagonals
    if ([0,1,2,3,4].every((i) => isMarked(i, i))) return true;
    if ([0,1,2,3,4].every((i) => isMarked(i, 4 - i))) return true;

    return false;
  }
}
