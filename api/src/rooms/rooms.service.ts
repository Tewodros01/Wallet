import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import {
  MissionCategory,
  PlayerStatus,
  Prisma,
  RoomStatus,
  TransactionType,
} from 'generated/prisma/client';
import {
  getPublicApiUrl,
  normalizeAvatarUrls,
} from '../common/utils/avatar-url.util';
import { MissionsService } from '../missions/missions.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  generateBoard,
  getBoardHash,
  hasWinningPattern,
  normalizeBoard,
  normalizeCalledNums,
  normalizeMarkedNums,
} from './bingo.util';
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
      finishedAt: true,
      user: {
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      },
    },
  },
  _count: { select: { players: true } },
} as const satisfies Prisma.GameRoomSelect;

type RoomDto = Prisma.GameRoomGetPayload<{ select: typeof roomSelect }>;
type RoomPlayerRecord = Prisma.RoomPlayerGetPayload<{
  include: {
    user: {
      select: {
        id: true;
        username: true;
        firstName: true;
        lastName: true;
        avatar: true;
      };
    };
  };
}>;
type RoomPlayerResponse = RoomPlayerRecord & { cards: PlayerCardDto[] };
type JoinRoomResult = {
  success: true;
  cards: PlayerCardDto[];
  cardsToSelect: number;
};
type ClaimBingoResult = { winner: string; prize: number };
type GameHistoryItem = {
  roomId: string;
  room: {
    id: string;
    name: string;
    status: RoomStatus;
    entryFee: number;
    prizePool: number;
    startedAt: Date | null;
    finishedAt: Date | null;
    host: {
      id: string;
      username: string;
      avatar: string | null;
    };
    _count: { players: number };
  };
  result: 'WIN' | 'LOSS';
  prize: number;
  status: PlayerStatus;
  joinedAt: Date;
};
type RoomPlayerCardWithCard = Prisma.RoomPlayerCardGetPayload<{
  include: {
    card: {
      select: {
        id: true;
        board: true;
      };
    };
  };
}>;
const roomSummarySelect = {
  id: true,
  name: true,
  hostId: true,
  status: true,
  entryFee: true,
  prizePool: true,
  maxPlayers: true,
  cardsPerPlayer: true,
  isPrivate: true,
  password: true,
} as const satisfies Prisma.GameRoomSelect;
type GameRoomSummary = Prisma.GameRoomGetPayload<{
  select: typeof roomSummarySelect;
}>;
type RoomSummary = Pick<
  RoomDto,
  | 'id'
  | 'name'
  | 'entryFee'
  | 'prizePool'
  | 'maxPlayers'
  | 'cardsPerPlayer'
  | 'status'
> & {
  password?: string | null;
};

type PlayerCardDto = {
  id: string;
  roomPlayerCardId: string;
  board: number[][];
  markedNums: number[];
};

type AvailableRoomCardDto = {
  id: string;
  board: number[][];
};

@Injectable()
export class RoomsService {
  private readonly logger = new Logger(RoomsService.name);
  private static readonly SERIALIZABLE_RETRIES = 3;

  constructor(
    private readonly prisma: PrismaService,
    private readonly missionsService: MissionsService,
    private readonly configService: ConfigService,
  ) {}

  async findAll(query: QueryRoomsDto): Promise<RoomDto[]> {
    try {
      const rooms = await this.prisma.gameRoom.findMany({
        where: this.buildRoomWhere(query),
        select: roomSelect,
        orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
        take: 50,
      });

      return this.normalizeResponse(rooms);
    } catch {
      throw new InternalServerErrorException('Failed to fetch rooms');
    }
  }

  async findOne(id: string): Promise<RoomDto> {
    return this.getRoomByIdOrThrow(id);
  }

  async create(dto: CreateRoomDto, userId: string): Promise<RoomDto> {
    try {
      const hashedPassword =
        dto.isPrivate && dto.password
          ? await bcrypt.hash(dto.password, 10)
          : undefined;

      return await this.runSerializableTransaction(async (tx) => {
        const host = await tx.user.findUnique({
          where: { id: userId },
          select: { id: true },
        });
        if (!host) {
          throw new NotFoundException('Host user not found');
        }

        const room = await tx.gameRoom.create({
          data: {
            name: dto.name,
            hostId: userId,
            speed: dto.speed,
            entryFee: dto.entryFee ?? 0,
            maxPlayers: dto.maxPlayers ?? 50,
            cardsPerPlayer: dto.cardsPerPlayer ?? 1,
            isPrivate: dto.isPrivate ?? false,
            password: dto.isPrivate ? hashedPassword : null,
          },
          select: {
            id: true,
            cardsPerPlayer: true,
            maxPlayers: true,
          },
        });

        await this.createRoomCardPoolTx(
          tx,
          room.id,
          room.maxPlayers * room.cardsPerPlayer,
        );
        await this.createRoomPlayerTx(tx, room.id, userId);

        return this.getRoomByIdOrThrowTx(tx, room.id);
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      this.logger.error(
        'Failed to create room',
        error instanceof Error ? error.stack : String(error),
      );
      throw new InternalServerErrorException('Failed to create room');
    }
  }

  async join(
    roomId: string,
    userId: string,
    dto: JoinRoomDto,
  ): Promise<JoinRoomResult> {
    try {
      const result: JoinRoomResult = await this.runSerializableTransaction(
        async (tx) => {
          const room = await tx.gameRoom.findUnique({ where: { id: roomId } });
          if (!room) throw new NotFoundException('Room not found');

          await this.assertJoinAllowed(tx, room, userId, dto);
          await this.assertEntryAffordableTx(tx, room, userId);

          await this.createRoomPlayerTx(tx, roomId, userId);

          return {
            success: true as const,
            cards: [],
            cardsToSelect: room.cardsPerPlayer,
          };
        },
      );

      return result;
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('Already in this room');
      }

      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to join room');
    }
  }

  async getMyPlayer(
    roomId: string,
    userId: string,
  ): Promise<RoomPlayerResponse> {
    const player = await this.prisma.roomPlayer.findUnique({
      where: { roomId_userId: { roomId, userId } },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
          },
        },
      },
    });

    if (!player) throw new NotFoundException('You are not in this room');

    const cards = await this.getPlayerCards(player.id);

    return this.normalizeResponse({
      ...player,
      cards,
    });
  }

  async getAvailableCards(
    roomId: string,
    userId: string,
  ): Promise<AvailableRoomCardDto[]> {
    const room = await this.getRoomSummaryOrThrow(roomId);
    await this.assertPlayerInRoom(roomId, userId);

    if (room.status !== RoomStatus.WAITING) {
      throw new BadRequestException('Card selection is only available before the game starts');
    }

    const cards = await this.prisma.bingoCard.findMany({
      where: {
        roomId,
        playerCard: null,
      },
      select: {
        id: true,
        board: true,
      },
      orderBy: { createdAt: 'asc' },
    });

    try {
      return cards.map((card) => ({
        id: card.id,
        board: normalizeBoard(card.board),
      }));
    } catch {
      throw new InternalServerErrorException('Stored bingo card data is invalid');
    }
  }

  async selectCards(
    roomId: string,
    userId: string,
    selectedCardIds: string[],
  ): Promise<{ cards: PlayerCardDto[] }> {
    const uniqueCardIds = Array.from(new Set(selectedCardIds));

    try {
      return await this.runSerializableTransaction(async (tx) => {
        const room = await this.getRoomSummaryOrThrowTx(tx, roomId);
        if (room.status !== RoomStatus.WAITING) {
          throw new BadRequestException('Card selection is closed for this room');
        }

        const player = await tx.roomPlayer.findUnique({
          where: { roomId_userId: { roomId, userId } },
          select: { id: true },
        });
        if (!player) throw new NotFoundException('You are not in this room');

        const existingCards = await tx.roomPlayerCard.count({
          where: { roomPlayerId: player.id },
        });
        const remainingCards = room.cardsPerPlayer - existingCards;

      if (remainingCards <= 0) {
        return { cards: await this.getPlayerCardsTx(tx, player.id) };
      }

      if (uniqueCardIds.length < 1 || uniqueCardIds.length > remainingCards) {
        throw new BadRequestException(
          `Select between 1 and ${remainingCards} card${remainingCards === 1 ? '' : 's'}`,
        );
      }

        const availableCards = await tx.bingoCard.findMany({
          where: {
            id: { in: uniqueCardIds },
            roomId,
            playerCard: null,
          },
          select: { id: true },
        });

        if (availableCards.length !== uniqueCardIds.length) {
          throw new BadRequestException('One or more selected cards are no longer available');
        }

        if (room.entryFee > 0) {
          await this.chargeEntryFee(tx, room, userId, uniqueCardIds.length);
        }

        await Promise.all(
          uniqueCardIds.map((cardId) =>
            tx.roomPlayerCard.create({
              data: {
                roomPlayerId: player.id,
                cardId,
                markedNums: [],
              },
            }),
          ),
        );

        await tx.bingoCard.updateMany({
          where: { id: { in: uniqueCardIds } },
          data: { userId },
        });

        return { cards: await this.getPlayerCardsTx(tx, player.id) };
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new BadRequestException('One or more selected cards are no longer available');
      }
      throw error;
    }
  }

  async startGame(roomId: string, userId: string): Promise<RoomDto> {
    return this.runSerializableTransaction(async (tx) => {
      const room = await this.getRoomSummaryOrThrowTx(tx, roomId);
      if (room.hostId !== userId) {
        throw new ForbiddenException('Only the host can start the game');
      }
      if (room.status !== RoomStatus.WAITING) {
        throw new BadRequestException('Game already started');
      }

      const roomPlayers = await tx.roomPlayer.findMany({
        where: { roomId },
        select: {
          id: true,
          userId: true,
          _count: { select: { cards: true } },
        },
      });

      const hostPlayer = roomPlayers.find((player) => player.userId === userId);
      if (!hostPlayer) {
        throw new BadRequestException('Host must join the room before starting');
      }

      if (hostPlayer._count.cards < 1) {
        throw new BadRequestException(
          'Host must select at least one card before the game starts',
        );
      }

      const playersWithoutCards = roomPlayers.filter(
        (player) => player._count.cards < 1 && player.userId !== userId,
      );

      if (playersWithoutCards.length > 0) {
        await tx.roomPlayer.deleteMany({
          where: { id: { in: playersWithoutCards.map((player) => player.id) } },
        });
      }

      const activePlayerCount = roomPlayers.length - playersWithoutCards.length;
      if (activePlayerCount < 1) {
        throw new BadRequestException('No players in room');
      }

      const startedAt = new Date();
      const startedRoom = await tx.gameRoom.updateMany({
        where: { id: roomId, status: RoomStatus.WAITING },
        data: { status: RoomStatus.PLAYING, startedAt },
      });
      if (startedRoom.count !== 1) {
        throw new BadRequestException('Game already started');
      }

      await tx.roomPlayer.updateMany({
        where: { roomId },
        data: { status: PlayerStatus.PLAYING },
      });

      await tx.gameRound.create({ data: { roomId } });

      return this.getRoomByIdOrThrowTx(tx, roomId);
    });
  }

  async claimBingo(
    roomId: string,
    userId: string,
    cardId?: string,
  ): Promise<ClaimBingoResult> {
    try {
      const result = await this.runSerializableTransaction(async (tx) => {
        const room = await tx.gameRoom.findUnique({
          where: { id: roomId },
        });
        if (!room || room.status !== RoomStatus.PLAYING) {
          throw new BadRequestException('Game is not active');
        }

        const player = await tx.roomPlayer.findUnique({
          where: { roomId_userId: { roomId, userId } },
        });
        if (!player) throw new NotFoundException('Player not in room');
        if (player.hasBingo) {
          throw new BadRequestException('Already claimed BINGO');
        }

        await this.getClaimableCardTx(tx, player.id, roomId, cardId);

        const finishedAt = new Date();
        const prize = room.prizePool;
        const participants = await tx.roomPlayer.findMany({
          where: { roomId },
          select: { userId: true },
        });

        const finishedRoom = await tx.gameRoom.updateMany({
          where: {
            id: roomId,
            status: RoomStatus.PLAYING,
            winnerId: null,
          },
          data: {
            status: RoomStatus.FINISHED,
            winnerId: userId,
            finishedAt,
          },
        });
        if (finishedRoom.count !== 1) {
          throw new BadRequestException('BINGO has already been claimed');
        }

        await tx.roomPlayer.update({
          where: { roomId_userId: { roomId, userId } },
          data: {
            hasBingo: true,
            status: PlayerStatus.WON,
            prize,
            finishedAt,
          },
        });

        await tx.roomPlayer.updateMany({
          where: { roomId, userId: { not: userId } },
          data: {
            status: PlayerStatus.LOST,
            finishedAt,
          },
        });

        await tx.user.update({
          where: { id: userId },
          data: { coinsBalance: { increment: prize } },
        });

        const wallet = await tx.wallet.findFirst({
          where: { userId, isDefault: true, isActive: true, deletedAt: null },
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

        return {
          winner: userId,
          prize,
          participantIds: participants.map((participant) => participant.userId),
        };
      });

      await Promise.allSettled(
        result.participantIds.map((participantId) =>
          this.missionsService.incrementCategoryProgress(
            participantId,
            MissionCategory.PLAY_GAMES,
          ),
        ),
      );

      void this.missionsService
        .incrementCategoryProgress(userId, MissionCategory.WIN_GAMES)
        .catch(() => {});

      return {
        winner: result.winner,
        prize: result.prize,
      };
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }

      throw new InternalServerErrorException('Failed to claim BINGO');
    }
  }

  async getGameHistory(userId: string): Promise<GameHistoryItem[]> {
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

      return this.normalizeResponse(players.map((player) => ({
        roomId: player.roomId,
        room: player.room,
        result: player.hasBingo ? 'WIN' : 'LOSS',
        prize: player.prize,
        status: player.status,
        joinedAt: player.joinedAt,
      })));
    } catch {
      throw new InternalServerErrorException('Failed to fetch game history');
    }
  }

  private async chargeEntryFee(
    tx: Prisma.TransactionClient,
    room: RoomSummary,
    userId: string,
    cardCount = 1,
  ): Promise<void> {
    const totalEntryFee = room.entryFee * cardCount;

    const updatedUser = await tx.user.updateMany({
      where: {
        id: userId,
        coinsBalance: { gte: totalEntryFee },
      },
      data: { coinsBalance: { decrement: totalEntryFee } },
    });

    if (updatedUser.count !== 1) {
      throw new BadRequestException('Insufficient coin balance');
    }

    await tx.gameRoom.update({
      where: { id: room.id },
      data: { prizePool: { increment: totalEntryFee } },
    });

    const wallet = await tx.wallet.findFirst({
      where: { userId, isDefault: true, isActive: true, deletedAt: null },
    });

    if (!wallet) return;

    await tx.transaction.create({
      data: {
        title:
          cardCount > 1
            ? `Room Entry x${cardCount}: ${room.name}`
            : `Room Entry: ${room.name}`,
        amount: totalEntryFee,
        type: TransactionType.GAME_ENTRY,
        date: new Date(),
        userId,
        walletId: wallet.id,
        gameRoomId: room.id,
      },
    });

    const updatedWallet = await tx.wallet.updateMany({
      where: {
        id: wallet.id,
        balance: { gte: new Prisma.Decimal(totalEntryFee) },
      },
      data: { balance: { decrement: new Prisma.Decimal(totalEntryFee) } },
    });
    if (updatedWallet.count !== 1) {
      throw new BadRequestException('Insufficient wallet balance');
    }
  }

  private async runSerializableTransaction<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    for (
      let attempt = 1;
      attempt <= RoomsService.SERIALIZABLE_RETRIES;
      attempt += 1
    ) {
      try {
        return await this.prisma.$transaction(operation, {
          isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
        });
      } catch (error) {
        if (
          error instanceof Prisma.PrismaClientKnownRequestError &&
          error.code === 'P2034' &&
          attempt < RoomsService.SERIALIZABLE_RETRIES
        ) {
          const delayMs = 40 * attempt + Math.floor(Math.random() * 30);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        throw error;
      }
    }

    throw new InternalServerErrorException('Transaction failed after retries');
  }

  private async createRoomPlayerTx(
    tx: Prisma.TransactionClient,
    roomId: string,
    userId: string,
  ): Promise<{ id: string }> {
    return tx.roomPlayer.create({
      data: { roomId, userId },
    });
  }

  private async createRoomCardPoolTx(
    tx: Prisma.TransactionClient,
    roomId: string,
    totalCards: number,
  ): Promise<void> {
    const cards: Array<{
      roomId: string;
      board: number[][];
      boardHash: string;
    }> = [];
    const hashes = new Set<string>();

    while (cards.length < totalCards) {
      const board = generateBoard();
      const boardHash = getBoardHash(board);
      if (hashes.has(boardHash)) continue;

      hashes.add(boardHash);
      cards.push({
        roomId,
        board,
        boardHash,
      });
    }

    await tx.bingoCard.createMany({ data: cards });
  }

  private async getPlayerCards(roomPlayerId: string): Promise<PlayerCardDto[]> {
    return this.getPlayerCardsTx(this.prisma, roomPlayerId);
  }

  private async getPlayerCardsTx(
    db: PrismaService | Prisma.TransactionClient,
    roomPlayerId: string,
  ): Promise<PlayerCardDto[]> {
    const args = {
      where: { roomPlayerId },
      include: {
        card: {
          select: {
            id: true,
            board: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    } as const satisfies Prisma.RoomPlayerCardFindManyArgs;

    const records = (await db.roomPlayerCard.findMany(
      args,
    )) as RoomPlayerCardWithCard[];

    try {
      return records.map(
        (record): PlayerCardDto => ({
          id: record.card.id,
          roomPlayerCardId: record.id,
          board: normalizeBoard(record.card.board),
          markedNums: normalizeMarkedNums(record.markedNums),
        }),
      );
    } catch {
      throw new InternalServerErrorException(
        'Stored bingo card data is invalid',
      );
    }
  }

  private buildRoomWhere(query: QueryRoomsDto): Prisma.GameRoomWhereInput {
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
        { host: { is: { username: { contains: query.search } } } },
      ];
    }

    return where;
  }

  private async getRoomByIdOrThrow(id: string): Promise<RoomDto> {
    return this.getRoomByIdOrThrowTx(this.prisma, id);
  }

  private async getRoomByIdOrThrowTx(
    db: PrismaService | Prisma.TransactionClient,
    id: string,
  ): Promise<RoomDto> {
    const room = await db.gameRoom.findUnique({
      where: { id },
      select: roomSelect,
    });

    if (!room) throw new NotFoundException('Room not found');
    return this.normalizeResponse(room);
  }

  private async getRoomSummaryOrThrow(
    roomId: string,
  ): Promise<GameRoomSummary> {
    return this.getRoomSummaryOrThrowTx(this.prisma, roomId);
  }

  private async getRoomSummaryOrThrowTx(
    db: PrismaService | Prisma.TransactionClient,
    roomId: string,
  ): Promise<GameRoomSummary> {
    const room = await db.gameRoom.findUnique({
      where: { id: roomId },
      select: roomSummarySelect,
    });

    if (!room) throw new NotFoundException('Room not found');
    return room;
  }

  private async assertPlayerInRoom(roomId: string, userId: string): Promise<void> {
    const player = await this.prisma.roomPlayer.findUnique({
      where: { roomId_userId: { roomId, userId } },
      select: { id: true },
    });

    if (!player) {
      throw new NotFoundException('You are not in this room');
    }
  }

  private async assertJoinAllowed(
    tx: Prisma.TransactionClient,
    room: GameRoomSummary,
    userId: string,
    dto: JoinRoomDto,
  ): Promise<void> {
    if (room.status !== RoomStatus.WAITING) {
      throw new BadRequestException('Room is not accepting players');
    }

    const [playerCount, existing] = await Promise.all([
      tx.roomPlayer.count({ where: { roomId: room.id } }),
      tx.roomPlayer.findUnique({
        where: { roomId_userId: { roomId: room.id, userId } },
      }),
    ]);

    if (playerCount >= room.maxPlayers) {
      throw new BadRequestException('Room is full');
    }

    if (existing) {
      throw new BadRequestException('Already in this room');
    }

    if (!room.isPrivate || !room.password) return;
    if (!dto.password) {
      throw new BadRequestException('Password required');
    }

    const isValidPassword = await bcrypt.compare(dto.password, room.password);
    if (!isValidPassword) {
      throw new ForbiddenException('Incorrect room password');
    }
  }

  private async assertEntryAffordableTx(
    tx: Prisma.TransactionClient,
    room: GameRoomSummary,
    userId: string,
  ): Promise<void> {
    if (room.entryFee <= 0) return;

    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { coinsBalance: true },
    });
    if (!user || user.coinsBalance < room.entryFee) {
      throw new BadRequestException(
        'You need enough coins for at least one card before joining this room',
      );
    }

    const wallet = await tx.wallet.findFirst({
      where: {
        userId,
        isDefault: true,
        isActive: true,
        deletedAt: null,
      },
      select: { balance: true },
    });

    if (wallet && wallet.balance.lt(new Prisma.Decimal(room.entryFee))) {
      throw new BadRequestException(
        'Your wallet balance is too low to claim a card in this room',
      );
    }
  }

  private async getClaimableCardTx(
    tx: Prisma.TransactionClient,
    roomPlayerId: string,
    roomId: string,
    cardId?: string,
  ): Promise<RoomPlayerCardWithCard> {
    const latestRound = await tx.gameRound.findFirst({
      where: { roomId },
      orderBy: { createdAt: 'desc' },
      select: { calledNums: true },
    });

    const calledNums = normalizeCalledNums(latestRound?.calledNums);
    if (calledNums.length === 0) {
      throw new BadRequestException('No numbers have been called yet');
    }

    const playerCards = await tx.roomPlayerCard.findMany({
      where: {
        roomPlayerId,
        ...(cardId ? { cardId } : {}),
      },
      include: {
        card: {
          select: {
            id: true,
            board: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    if (cardId && playerCards.length === 0) {
      throw new BadRequestException(
        'Selected card does not belong to this player',
      );
    }

    if (playerCards.length === 0) {
      throw new BadRequestException('Player has no cards in this room');
    }

    try {
      const called = new Set(calledNums);

      for (const playerCard of playerCards) {
        const board = normalizeBoard(playerCard.card.board);
        const marked = new Set(normalizeMarkedNums(playerCard.markedNums));
        marked.add(0);

        if (hasWinningPattern(board, marked, called)) {
          return playerCard;
        }
      }
    } catch {
      throw new InternalServerErrorException(
        'Stored bingo card data is invalid',
      );
    }

    throw new BadRequestException('No valid BINGO pattern detected');
  }

  private normalizeResponse<T>(value: T): T {
    return normalizeAvatarUrls(value, getPublicApiUrl(this.configService));
  }
}
