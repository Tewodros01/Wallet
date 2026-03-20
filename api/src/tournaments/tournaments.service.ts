import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  MissionCategory,
  TransactionType,
  TournamentStatus,
} from 'generated/prisma/client';
import { normalizeAvatarUrls } from '../common/utils/avatar-url.util';
import { MissionsService } from '../missions/missions.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTournamentDto } from './dto/tournament.dto';

@Injectable()
export class TournamentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly missionsService: MissionsService,
    private readonly configService: ConfigService,
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
    return { ...t, joinedCount: t._count.players, isJoined: t.players.length > 0, players: undefined, _count: undefined };
  }

  async join(tournamentId: string, userId: string) {
    const t = await this.prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: { _count: { select: { players: true } } },
    });
    if (!t) throw new NotFoundException('Tournament not found');
    if (t.status === TournamentStatus.FINISHED || t.status === TournamentStatus.CANCELLED)
      throw new BadRequestException('Tournament is no longer open');
    if (t._count.players >= t.maxPlayers) throw new BadRequestException('Tournament is full');

    const existing = await this.prisma.tournamentPlayer.findUnique({
      where: { tournamentId_userId: { tournamentId, userId } },
    });
    if (existing) throw new BadRequestException('Already joined');

    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { coinsBalance: true } });
    if (!user || user.coinsBalance < t.entryFee)
      throw new BadRequestException('Insufficient coin balance');

    const result = await this.prisma.$transaction(async (tx) => {
      if (t.entryFee > 0) {
        await tx.user.update({ where: { id: userId }, data: { coinsBalance: { decrement: t.entryFee } } });
        await tx.tournament.update({ where: { id: tournamentId }, data: { prize: { increment: t.entryFee } } });
        const wallet = await tx.wallet.findFirst({ where: { userId, isDefault: true, deletedAt: null } });
        if (wallet) {
          await tx.transaction.create({
            data: { title: `Tournament entry: ${t.name}`, amount: t.entryFee, type: TransactionType.GAME_ENTRY, date: new Date(), userId, walletId: wallet.id },
          });
          await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { decrement: t.entryFee } } });
        }
      }
      await tx.tournamentPlayer.create({ data: { tournamentId, userId } });

      // create notification
      await tx.notification.create({
        data: { userId, type: 'TOURNAMENT', title: 'Tournament Joined!', body: `You successfully joined "${t.name}". Good luck! 🏆` },
      });

      const updated = await tx.user.findUnique({ where: { id: userId }, select: { coinsBalance: true } });
      return { success: true, newBalance: updated?.coinsBalance ?? 0 };
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
      select: { id: true, username: true, firstName: true, lastName: true, avatar: true },
    });
    const userMap = new Map(users.map((u) => [u.id, u]));

    return normalizeAvatarUrls(sorted.map(([userId, totalPrize], i) => ({
      rank: i + 1,
      user: userMap.get(userId),
      wins: wins.filter((w) => w.userId === userId).length,
      totalPrize,
    })), this.configService.get<string>(
      'publicApiUrl',
      `http://localhost:${this.configService.get<number>('port', 3000)}`,
    ));
  }

  async create(dto: CreateTournamentDto) {
    return this.prisma.tournament.create({
      data: { ...dto, startsAt: new Date(dto.startsAt) },
    });
  }

  async getTotalPrizePool() {
    try {
      const result = await this.prisma.tournament.aggregate({
        where: { status: { in: [TournamentStatus.UPCOMING, TournamentStatus.LIVE] } },
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
    if (t.status === TournamentStatus.FINISHED || t.status === TournamentStatus.CANCELLED)
      throw new BadRequestException('Tournament already ended');

    // verify winner is a registered player
    const player = await this.prisma.tournamentPlayer.findUnique({
      where: { tournamentId_userId: { tournamentId, userId: winnerUserId } },
    });
    if (!player) throw new BadRequestException('Winner is not a registered player');

    return this.prisma.$transaction(async (tx) => {
      await tx.tournament.update({
        where: { id: tournamentId },
        data: { status: TournamentStatus.FINISHED, finishedAt: new Date() },
      });

      if (t.prize > 0) {
        await tx.user.update({ where: { id: winnerUserId }, data: { coinsBalance: { increment: t.prize } } });
        const wallet = await tx.wallet.findFirst({ where: { userId: winnerUserId, isDefault: true, deletedAt: null } });
        if (wallet) {
          await tx.transaction.create({
            data: { title: `Tournament win: ${t.name}`, amount: t.prize, type: TransactionType.GAME_WIN, date: new Date(), userId: winnerUserId, walletId: wallet.id },
          });
          await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: t.prize } } });
        }
        await tx.notification.create({
          data: { userId: winnerUserId, type: 'TOURNAMENT', title: '🏆 Tournament Winner!', body: `You won the "${t.name}" tournament and earned ${t.prize.toLocaleString()} coins!` },
        });
      }

      return { success: true, winner: winnerUserId, prize: t.prize };
    });
  }
}
