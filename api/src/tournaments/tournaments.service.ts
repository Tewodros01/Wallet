import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomInt } from 'crypto';
import {
  Prisma,
  MissionCategory,
  TournamentStatus,
  TransactionType,
} from 'generated/prisma/client';
import { normalizeAvatarUrls } from '../common/utils/avatar-url.util';
import { LedgerService } from '../ledger/ledger.service';
import { MissionsService } from '../missions/missions.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTournamentDto } from './dto/tournament.dto';

const TOURNAMENT_RAKE_BPS = 1000;

@Injectable()
export class TournamentsService {
  private static readonly SERIALIZABLE_RETRIES = 3;

  constructor(
    private readonly prisma: PrismaService,
    private readonly missionsService: MissionsService,
    private readonly configService: ConfigService,
    private readonly ledgerService: LedgerService,
  ) {}

  async findAll(userId: string) {
    const tournaments = await this.prisma.tournament.findMany({
      orderBy: { startsAt: 'asc' },
      include: {
        _count: { select: { players: true } },
        players: { where: { userId }, select: { id: true } },
      },
    });

    return tournaments.map((t) => ({
      ...t,
      joinedCount: t._count.players,
      isJoined: t.players.length > 0,
      players: undefined,
      _count: undefined,
    }));
  }

  async findOne(id: string, userId: string) {
    const t = await this.prisma.tournament.findUnique({
      where: { id },
      include: {
        _count: { select: { players: true } },
        players: { where: { userId }, select: { id: true } },
      },
    });
    if (!t) throw new NotFoundException('Tournament not found');
    return {
      ...t,
      joinedCount: t._count.players,
      isJoined: t.players.length > 0,
      players: undefined,
      _count: undefined,
    };
  }

  async join(tournamentId: string, userId: string) {
    const result = await this.runSerializableTransaction(async (tx) => {
      const t = await tx.tournament.findUnique({
        where: { id: tournamentId },
        include: { _count: { select: { players: true } } },
      });
      if (!t) throw new NotFoundException('Tournament not found');
      if (
        t.status === TournamentStatus.FINISHED ||
        t.status === TournamentStatus.CANCELLED
      ) {
        throw new BadRequestException('Tournament is no longer open');
      }
      if (t._count.players >= t.maxPlayers) {
        throw new BadRequestException('Tournament is full');
      }

      const existing = await tx.tournamentPlayer.findUnique({
        where: { tournamentId_userId: { tournamentId, userId } },
      });
      if (existing) throw new BadRequestException('Already joined');

      if (t.entryFee > 0) {
        const rake = Math.floor((t.entryFee * TOURNAMENT_RAKE_BPS) / 10_000);
        const prizeContribution = t.entryFee - rake;

        await this.ledgerService.applyEntry(tx, {
          userId,
          title: `Tournament entry: ${t.name}`,
          amount: t.entryFee,
          balanceDelta: -t.entryFee,
          type: TransactionType.GAME_ENTRY,
        });
        await tx.tournament.update({
          where: { id: tournamentId },
          data: { prize: { increment: prizeContribution } },
        });
      }
      await tx.tournamentPlayer.create({ data: { tournamentId, userId } });

      // create notification
      await tx.notification.create({
        data: {
          userId,
          type: 'TOURNAMENT',
          title: 'Tournament Joined!',
          body: `You successfully joined "${t.name}". Good luck! 🏆`,
        },
      });

      const newBalance = await this.ledgerService.getBalance(tx, userId);
      return { success: true, newBalance };
    });

    void this.missionsService
      .incrementCategoryProgress(userId, MissionCategory.TOURNAMENT)
      .catch(() => {});

    return result;
  }

  async getLeaderboard() {
    const wins = await this.prisma.transaction.findMany({
      where: { title: { startsWith: 'Tournament win' }, type: 'GAME_WIN' },
      select: { userId: true, amount: true },
    });

    const map = new Map<string, number>();
    for (const w of wins) {
      map.set(w.userId, (map.get(w.userId) ?? 0) + Number(w.amount));
    }

    const sorted = [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, 20);
    const userIds = sorted.map(([id]) => id);
    const users = await this.prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        username: true,
        firstName: true,
        lastName: true,
        avatar: true,
      },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return normalizeAvatarUrls(
      sorted.map(([userId, totalPrize], i) => ({
        rank: i + 1,
        user: userMap.get(userId),
        wins: wins.filter((w) => w.userId === userId).length,
        totalPrize,
      })),
      this.configService.get<string>(
        'publicApiUrl',
        `http://localhost:${this.configService.get<number>('port', 3000)}`,
      ),
    );
  }

  async create(dto: CreateTournamentDto) {
    return this.prisma.tournament.create({
      data: { ...dto, startsAt: new Date(dto.startsAt) },
    });
  }

  async getTotalPrizePool() {
    try {
      const result = await this.prisma.tournament.aggregate({
        where: {
          status: { in: [TournamentStatus.UPCOMING, TournamentStatus.LIVE] },
        },
        _sum: { prize: true },
      });
      return { totalPrize: result._sum.prize ?? 0 };
    } catch {
      throw new InternalServerErrorException('Failed to fetch prize pool');
    }
  }

  async finishTournament(tournamentId: string, winnerUserId: string) {
    const t = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { _count: { select: { players: true } } },
    });
    if (!t) throw new NotFoundException('Tournament not found');
    if (
      t.status === TournamentStatus.FINISHED ||
      t.status === TournamentStatus.CANCELLED
    )
      throw new BadRequestException('Tournament already ended');

    // verify winner is a registered player
    const player = await this.prisma.tournamentPlayer.findUnique({
      where: { tournamentId_userId: { tournamentId, userId: winnerUserId } },
    });
    if (!player)
      throw new BadRequestException('Winner is not a registered player');

    return this.prisma.$transaction(async (tx) => {
      await tx.tournament.update({
        where: { id: tournamentId },
        data: { status: TournamentStatus.FINISHED, finishedAt: new Date() },
      });

      if (t.prize > 0) {
        await this.ledgerService.applyEntry(tx, {
          userId: winnerUserId,
          title: `Tournament win: ${t.name}`,
          amount: t.prize,
          balanceDelta: t.prize,
          type: TransactionType.GAME_WIN,
        });
        await tx.notification.create({
          data: {
            userId: winnerUserId,
            type: 'TOURNAMENT',
            title: '🏆 Tournament Winner!',
            body: `You won the "${t.name}" tournament and earned ${t.prize.toLocaleString()} coins!`,
          },
        });
      }

      return { success: true, winner: winnerUserId, prize: t.prize };
    });
  }

  private async runSerializableTransaction<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    for (
      let attempt = 1;
      attempt <= TournamentsService.SERIALIZABLE_RETRIES;
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
          attempt < TournamentsService.SERIALIZABLE_RETRIES
        ) {
          const delayMs = 40 * attempt + randomInt(0, 30);
          await new Promise((resolve) => setTimeout(resolve, delayMs));
          continue;
        }

        throw error;
      }
    }

    throw new InternalServerErrorException('Transaction failed after retries');
  }
}
