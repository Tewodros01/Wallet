import { Logger } from '@nestjs/common';
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
import {
  cardContainsNumber,
  hasWinningPattern,
  normalizeBoard,
  normalizeCalledNums,
  normalizeMarkedNums,
} from '../rooms/bingo.util';
import { GameSpeed, PlayerStatus, RoomStatus } from 'generated/prisma/client';

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

type GatewayPlayerCard = {
  id: string;
  cardId: string;
  markedNums: unknown;
  card: { id: string; board: unknown };
};

type GatewayRoomPlayerWithCards = {
  cards: GatewayPlayerCard[];
};

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
    void this.restoreActiveGames();
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

  private async getRoomAccess(
    roomId: string,
    userId: string,
  ): Promise<{ room: { id: string; isPrivate: boolean }; isMember: boolean }> {
    const room = await this.prisma.gameRoom.findUnique({
      where: { id: roomId },
      select: { id: true, isPrivate: true },
    });
    if (!room) throw new WsException('Room not found');

    const player = await this.prisma.roomPlayer.findUnique({
      where: { roomId_userId: { roomId, userId } },
      select: { id: true },
    });

    return { room, isMember: Boolean(player) };
  }

  private buildRemaining(called: number[]): number[] {
    const set = new Set(called);
    return Array.from({ length: 75 }, (_, i) => i + 1).filter((n) => !set.has(n));
  }

  private async restoreActiveGames() {
    try {
      const activeRooms = await this.prisma.gameRoom.findMany({
        where: { status: RoomStatus.PLAYING },
        include: {
          rounds: {
            orderBy: { createdAt: 'desc' },
            take: 1,
          },
        },
      });

      for (const room of activeRooms) {
        const calledNums = normalizeCalledNums(room.rounds[0]?.calledNums);
        const state: RoomState = {
          calledNums,
          remaining: this.buildRemaining(calledNums),
          intervalId: null,
          speed: room.speed,
        };
        this.rooms.set(room.id, state);
        if (state.remaining.length > 0) {
          this.startAutoCaller(room.id, state);
        }
      }
    } catch (error) {
      this.logger.error(
        'Failed to restore active games',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private async ensureRoomState(roomId: string): Promise<RoomState | null> {
    const existing = this.rooms.get(roomId);
    if (existing) return existing;

    const room = await this.prisma.gameRoom.findUnique({
      where: { id: roomId },
      include: {
        rounds: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!room || room.status !== RoomStatus.PLAYING) {
      return null;
    }

    const calledNums = normalizeCalledNums(room.rounds[0]?.calledNums);
    const state: RoomState = {
      calledNums,
      remaining: this.buildRemaining(calledNums),
      intervalId: null,
      speed: room.speed,
    };
    this.rooms.set(roomId, state);

    if (state.remaining.length > 0) {
      this.startAutoCaller(roomId, state);
    }

    return state;
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
    const alreadyJoined = client.rooms.has(roomId);

    // verify player is in the DB room
    const player = await this.prisma.roomPlayer.findUnique({
      where: { roomId_userId: { roomId, userId } },
      include: {
        cards: {
          include: { card: true },
        },
      },
    });
    if (!player) throw new WsException('Not a member of this room');

    await client.join(roomId);

    // send current game state if game is already running
    const state = await this.ensureRoomState(roomId);
    if (state) {
      client.emit('game:state', {
        calledNums: state.calledNums,
        current:    state.calledNums.at(-1) ?? null,
        remaining:  state.remaining.length,
      });
    }

    const playerWithCards = player as typeof player & GatewayRoomPlayerWithCards;

    client.emit('player:cards', {
      cards: playerWithCards.cards.map((entry) => ({
        id: entry.card.id,
        roomPlayerCardId: entry.id,
        board: entry.card.board,
        markedNums: Array.isArray(entry.markedNums) ? entry.markedNums : [],
      })),
    });

    if (!alreadyJoined) {
      this.server.to(roomId).emit('room:player_joined', {
        userId,
        count: await this.prisma.roomPlayer.count({ where: { roomId } }),
      });
    }

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

    await this.ensureRoomState(roomId);
    await this.callNextNumber(roomId);
    return { success: true };
  }

  /** Player marks a number on their card */
  @SubscribeMessage('player:mark')
  async onPlayerMark(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; cardId: string; number: number },
  ) {
    const userId = this.getUserId(client);
    const { roomId, cardId, number } = payload;

    const state = await this.ensureRoomState(roomId);
    if (!state || !state.calledNums.includes(number)) {
      throw new WsException('Number has not been called');
    }

    const player = await this.prisma.roomPlayer.findUnique({
      where: { roomId_userId: { roomId, userId } },
      include: {
        cards: {
          include: { card: true },
        },
      },
    });
    if (!player) throw new WsException('Not in room');

    const playerWithCards = player as typeof player & GatewayRoomPlayerWithCards;
    const playerCard = playerWithCards.cards.find((entry) => entry.cardId === cardId);
    if (!playerCard) throw new WsException('Card not found');

    const board = normalizeBoard(playerCard.card.board);
    const hasNumber = cardContainsNumber(board, number);
    if (!hasNumber) throw new WsException('Number is not on this card');

    const marked = normalizeMarkedNums(playerCard.markedNums);
    if (!marked.includes(number)) {
      marked.push(number);
      await this.prisma.roomPlayerCard.update({
        where: { id: playerCard.id },
        data: { markedNums: marked },
      });
    }

    client.emit('player:marked', { cardId, number, markedNums: marked });
    return { success: true };
  }

  /** Player claims BINGO */
  @SubscribeMessage('game:bingo')
  async onBingoClaim(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string; cardId: string },
  ) {
    const userId = this.getUserId(client);
    const { roomId, cardId } = payload;

    const state = await this.ensureRoomState(roomId);
    if (!state) throw new WsException('Game not active');

    // validate win on server side
    const player = await this.prisma.roomPlayer.findUnique({
      where: { roomId_userId: { roomId, userId } },
      include: {
        cards: {
          include: { card: true },
        },
      },
    });
    if (!player) throw new WsException('Player not found');

    const playerWithCards = player as typeof player & GatewayRoomPlayerWithCards;
    const playerCard = playerWithCards.cards.find((entry) => entry.cardId === cardId);
    if (!playerCard?.card) throw new WsException('Card not found');

    const board = normalizeBoard(playerCard.card.board);
    const marked = new Set<number>(normalizeMarkedNums(playerCard.markedNums));
    marked.add(0); // free space

    if (!hasWinningPattern(board, marked, new Set(state.calledNums))) {
      throw new WsException('No valid BINGO pattern detected');
    }

    // persist win
    const result = await this.roomsService.claimBingo(roomId, userId, cardId);

    // stop auto-caller only after the win is persisted
    this.stopAutoCaller(roomId);

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

    await this.ensureRoomState(payload.roomId);
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

    const state = await this.ensureRoomState(payload.roomId);
    if (!state) throw new WsException('Game state not found');

    this.startAutoCaller(payload.roomId, state);
    this.server.to(payload.roomId).emit('game:resumed');
    return { success: true };
  }

  /** Player leaves a socket room */
  @SubscribeMessage('room:leave')
  async onRoomLeave(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { roomId: string },
  ) {
    const userId = this.getUserId(client);
    const { roomId } = payload;

    await client.leave(roomId);
    this.logger.log(`User ${userId} left socket room ${roomId}`);
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
    const { room, isMember } = await this.getRoomAccess(roomId, userId);
    if (room.isPrivate && !isMember) {
      throw new WsException('Private room spectators are not allowed');
    }

    // spectators join a separate sub-room so we can track them
    await client.join(`spectator:${roomId}`);
    await client.join(roomId); // also join main room to receive game events

    const state = await this.ensureRoomState(roomId);
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
    const userId = this.getUserId(client);
    const { roomId } = payload;
    const { room: accessRoom, isMember } = await this.getRoomAccess(roomId, userId);
    if (accessRoom.isPrivate && !isMember) {
      throw new WsException('Not authorized to view this room');
    }

    const state = await this.ensureRoomState(roomId);
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
      try {
        if (state.remaining.length === 0) {
          this.stopAutoCaller(roomId);
          await this.finishRoomWithoutWinner(roomId);
          this.server.to(roomId).emit('game:all_called');
          return;
        }
        await this.callNextNumber(roomId);
      } catch (error) {
        this.stopAutoCaller(roomId);
        await this.cancelRoomDueToRuntimeError(roomId);
        this.server.to(roomId).emit('game:cancelled', {
          roomId,
          message: 'Game stopped because of a server error.',
        });
        this.server.to(roomId).emit('exception', {
          message: 'Game stopped because of a server error.',
        });
        this.logger.error(
          `Auto-caller failed for room ${roomId}`,
          error instanceof Error ? error.stack : String(error),
        );
      }
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
    const idx = Math.floor(Math.random() * state.remaining.length);
    const number = state.remaining[idx];
    const nextCalledNums = [...state.calledNums, number];

    // persist to DB
    const updatedRounds = await this.prisma.gameRound.updateMany({
      where: {
        roomId,
        room: { status: RoomStatus.PLAYING },
      },
      data: { calledNums: nextCalledNums, currentNum: number },
    });
    if (updatedRounds.count < 1) {
      this.stopAutoCaller(roomId);
      this.rooms.delete(roomId);
      return;
    }

    state.remaining.splice(idx, 1);
    state.calledNums = nextCalledNums;

    // broadcast
    this.server.to(roomId).emit('game:number_called', {
      number,
      calledNums: state.calledNums,
      remaining:  state.remaining.length,
    });
  }

  private async finishRoomWithoutWinner(roomId: string) {
    const finishedAt = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.gameRoom.updateMany({
        where: {
          id: roomId,
          status: RoomStatus.PLAYING,
        },
        data: {
          status: RoomStatus.FINISHED,
          finishedAt,
        },
      });

      await tx.roomPlayer.updateMany({
        where: {
          roomId,
          status: {
            in: [PlayerStatus.JOINED, PlayerStatus.PLAYING],
          },
        },
        data: {
          status: PlayerStatus.LOST,
          finishedAt,
        },
      });
    });

    this.rooms.delete(roomId);
  }

  private async cancelRoomDueToRuntimeError(roomId: string) {
    const finishedAt = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.gameRoom.updateMany({
        where: {
          id: roomId,
          status: RoomStatus.PLAYING,
        },
        data: {
          status: RoomStatus.CANCELLED,
          finishedAt,
        },
      });

      await tx.roomPlayer.updateMany({
        where: {
          roomId,
          status: {
            in: [PlayerStatus.JOINED, PlayerStatus.PLAYING],
          },
        },
        data: {
          status: PlayerStatus.LEFT,
          finishedAt,
        },
      });
    });

    this.rooms.delete(roomId);
  }
}
