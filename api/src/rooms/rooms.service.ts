import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import {
  PlayerStatus,
  Prisma,
  RoomStatus,
  TransactionType,
} from 'generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateRoomDto, JoinRoomDto, QueryRoomsDto } from './dto/room.dto';

const roomSelect = {
  id: true,
  name: true,
  status: true,
  speed: true,
  entryFee: true,
  prizePool: true,
  maxPlayers: true,
  cardsPerPlayer: true,
  isPrivate: true,
  winnerId: true,
  startedAt: true,
  finishedAt: true,
  createdAt: true,
  host: {
    select: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      avatar: true,
    },
  },
  players: {
    select: {
      id: true,
      status: true,
      hasBingo: true,
      prize: true,
      joinedAt: true,
      user: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
      card: { select: { id: true, board: true } },
    },
  },
  _count: { select: { players: true } },
} as const;

// generate a random 5x5 bingo board
function generateBoard(): number[][] {
  const cols = [
    shuffle(range(1, 15)),
    shuffle(range(16, 30)),
    shuffle(range(31, 45)),
    shuffle(range(46, 60)),
    shuffle(range(61, 75)),
  ];
  return Array.from({ length: 5 }, (_, row) =>
    cols.map((col, ci) => (row === 2 && ci === 2 ? 0 : col[row])),
  );
}

function range(min: number, max: number) {
  return Array.from({ length: max - min + 1 }, (_, i) => i + min);
}

function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(query: QueryRoomsDto) {
    try {
      const where: Prisma.GameRoomWhereInput = {
        status: { not: RoomStatus.CANCELLED },
      };
      if (query.status && query.status !== 'all') {
        where.status = query.status.toUpperCase() as RoomStatus;
      }
      if (query.search) {
        where.OR = [
          { name: { contains: query.search } },
          { id: { contains: query.search } },
          { host: { username: { contains: query.search } } },
        ];
      }

      const rooms = await this.prisma.gameRoom.findMany({
        where,
        select: roomSelect,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        take: 50,
      });

      return rooms.map((r) => ({ ...r, password: undefined }));
    } catch {
      throw new InternalServerErrorException('Failed to fetch rooms');
    }
  }

  async findOne(id: string) {
    const room = await this.prisma.gameRoom.findUnique({
      where: { id },
      select: roomSelect,
    });
    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  async create(dto: CreateRoomDto, userId: string) {
    try {
      const hashedPw = dto.password
        ? await bcrypt.hash(dto.password, 10)
        : undefined;

      return await this.prisma.$transaction(async (tx) => {
        const room = await tx.gameRoom.create({
          data: {
            name: dto.name,
            hostId: userId,
            speed: dto.speed,
            entryFee: dto.entryFee ?? 0,
            maxPlayers: dto.maxPlayers ?? 50,
            cardsPerPlayer: dto.cardsPerPlayer ?? 1,
            isPrivate: dto.isPrivate ?? false,
            password: hashedPw,
          },
          select: roomSelect,
        });

        // auto-join host as a player so they can connect via socket
        const board = generateBoard();
        const card = await tx.bingoCard.create({ data: { userId, board } });
        await tx.roomPlayer.create({
          data: { roomId: room.id, userId, cardId: card.id },
        });

        return room;
      });
    } catch {
      throw new InternalServerErrorException('Failed to create room');
    }
  }

  async join(roomId: string, userId: string, dto: JoinRoomDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const room = await tx.gameRoom.findUnique({ where: { id: roomId } });
        if (!room) throw new NotFoundException('Room not found');
        if (room.status !== RoomStatus.WAITING)
          throw new BadRequestException('Room is not accepting players');

        const playerCount = await tx.roomPlayer.count({ where: { roomId } });
        if (playerCount >= room.maxPlayers)
          throw new BadRequestException('Room is full');

        const existing = await tx.roomPlayer.findUnique({
          where: { roomId_userId: { roomId, userId } },
        });
        if (existing) throw new BadRequestException('Already in this room');

        if (room.isPrivate && room.password) {
          if (!dto.password) throw new BadRequestException('Password required');
          const valid = await bcrypt.compare(dto.password, room.password);
          if (!valid) throw new ForbiddenException('Incorrect room password');
        }

        // deduct entry fee
        if (room.entryFee > 0) {
          const user = await tx.user.findUnique({
            where: { id: userId },
            select: { coinsBalance: true },
          });
          if (!user || user.coinsBalance < room.entryFee) {
            throw new BadRequestException('Insufficient coin balance');
          }
          await tx.user.update({
            where: { id: userId },
            data: { coinsBalance: { decrement: room.entryFee } },
          });
          await tx.gameRoom.update({
            where: { id: roomId },
            data: { prizePool: { increment: room.entryFee } },
          });

          const wallet = await tx.wallet.findFirst({
            where: { userId, isDefault: true, deletedAt: null },
          });
          if (wallet) {
            await tx.transaction.create({
              data: {
                title: `Room Entry: ${room.name}`,
                amount: room.entryFee,
                type: TransactionType.GAME_ENTRY,
                date: new Date(),
                userId,
                walletId: wallet.id,
                gameRoomId: roomId,
              },
            });
            await tx.wallet.update({
              where: { id: wallet.id },
              data: { balance: { decrement: room.entryFee } },
            });
          }
        }

        // assign a bingo card
        const board = generateBoard();
        const card = await tx.bingoCard.create({ data: { userId, board } });

        return tx.roomPlayer.create({
          data: { roomId, userId, cardId: card.id },
          include: {
            card: { select: { id: true, board: true } },
            user: { select: { id: true, username: true, avatar: true } },
          },
        });
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      )
        throw error;
      throw new InternalServerErrorException('Failed to join room');
    }
  }

  async getMyPlayer(roomId: string, userId: string) {
    const player = await this.prisma.roomPlayer.findUnique({
      where: { roomId_userId: { roomId, userId } },
      include: { card: { select: { id: true, board: true } } },
    });
    if (!player) throw new NotFoundException('You are not in this room');
    return player;
  }

  async startGame(roomId: string, userId: string) {
    const room = await this.prisma.gameRoom.findUnique({
      where: { id: roomId },
    });
    if (!room) throw new NotFoundException('Room not found');
    if (room.hostId !== userId)
      throw new ForbiddenException('Only the host can start the game');
    if (room.status !== RoomStatus.WAITING)
      throw new BadRequestException('Game already started');

    const playerCount = await this.prisma.roomPlayer.count({
      where: { roomId },
    });
    if (playerCount < 1) throw new BadRequestException('No players in room');

    return this.prisma.$transaction(async (tx) => {
      await tx.roomPlayer.updateMany({
        where: { roomId },
        data: { status: PlayerStatus.PLAYING },
      });
      await tx.gameRound.create({ data: { roomId } });
      return tx.gameRoom.update({
        where: { id: roomId },
        data: { status: RoomStatus.PLAYING, startedAt: new Date() },
        select: roomSelect,
      });
    });
  }

  async claimBingo(roomId: string, userId: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const room = await tx.gameRoom.findUnique({ where: { id: roomId } });
        if (!room || room.status !== RoomStatus.PLAYING)
          throw new BadRequestException('Game is not active');

        const player = await tx.roomPlayer.findUnique({
          where: { roomId_userId: { roomId, userId } },
        });
        if (!player) throw new NotFoundException('Player not in room');
        if (player.hasBingo)
          throw new BadRequestException('Already claimed BINGO');

        const prize = room.prizePool;

        await tx.roomPlayer.update({
          where: { roomId_userId: { roomId, userId } },
          data: { hasBingo: true, status: PlayerStatus.WON, prize },
        });

        await tx.gameRoom.update({
          where: { id: roomId },
          data: {
            status: RoomStatus.FINISHED,
            winnerId: userId,
            finishedAt: new Date(),
          },
        });

        // credit prize
        await tx.user.update({
          where: { id: userId },
          data: { coinsBalance: { increment: prize } },
        });

        const wallet = await tx.wallet.findFirst({
          where: { userId, isDefault: true, deletedAt: null },
        });
        if (wallet && prize > 0) {
          await tx.transaction.create({
            data: {
              title: `Bingo Win: ${room.name}`,
              amount: prize,
              type: TransactionType.GAME_WIN,
              date: new Date(),
              userId,
              walletId: wallet.id,
              gameRoomId: roomId,
            },
          });
          await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: { increment: prize } },
          });
        }

        return { winner: userId, prize };
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      )
        throw error;
      throw new InternalServerErrorException('Failed to claim BINGO');
    }
  }

  async getGameHistory(userId: string) {
    try {
      const players = await this.prisma.roomPlayer.findMany({
        where: { userId },
        include: {
          room: {
            select: {
              id: true,
              name: true,
              status: true,
              entryFee: true,
              prizePool: true,
              startedAt: true,
              finishedAt: true,
              host: { select: { id: true, username: true, avatar: true } },
              _count: { select: { players: true } },
            },
          },
        },
        orderBy: { joinedAt: 'desc' },
      });

      return players.map((p) => ({
        roomId: p.roomId,
        room: p.room,
        result: p.hasBingo ? 'WIN' : 'LOSS',
        prize: p.prize,
        status: p.status,
        joinedAt: p.joinedAt,
      }));
    } catch {
      throw new InternalServerErrorException('Failed to fetch game history');
    }
  }
}
