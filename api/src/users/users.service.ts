import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Prisma, Role } from 'generated/prisma/client';
import {
  getPublicApiUrl,
  toPublicAssetUrl,
} from '../common/utils/avatar-url.util';
import {
  IMAGE_UPLOAD_MIME_TYPES,
  storeUploadedFile,
} from '../common/utils/upload.util';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateUserDto } from './dto/update-user.dto';

const userSelect = {
  id: true,
  username: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  avatar: true,
  bio: true,
  role: true,
  coinsBalance: true,
  isVerified: true,
  onboardingDone: true,
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async findAll() {
    const users = await this.prisma.user.findMany({
      select: { ...userSelect, role: true, deletedAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return users.map((user) => this.serializeUser(user));
  }

  async updateRole(id: string, role: Role) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { role },
      select: userSelect,
    });
    return this.serializeUser(updatedUser);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: userSelect,
    });
    if (!user) throw new NotFoundException('User not found');
    return this.serializeUser(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: dto,
        select: userSelect,
      });
      return this.serializeUser(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = (error.meta?.target as string[]) ?? [];
        if (target.includes('username'))
          throw new ConflictException('Username already taken');
        if (target.includes('phone'))
          throw new ConflictException('Phone already in use');
      }
      throw new InternalServerErrorException('Failed to update profile');
    }
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const avatarUrl = storeUploadedFile({
      file,
      subdirectory: 'avatars',
      allowedMimeTypes: IMAGE_UPLOAD_MIME_TYPES,
      fallbackExtension: '.jpg',
      filenamePrefix: userId,
      errorMessage: 'Only JPG, PNG, WEBP, and GIF files are allowed',
    });
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: userSelect,
    });
    return {
      avatarUrl: this.toPublicAssetUrl(avatarUrl),
      user: this.serializeUser(user),
    };
  }

  async getGameStats(userId: string) {
    try {
      const [totalGames, wins, totalEarned] = await this.prisma.$transaction([
        this.prisma.roomPlayer.count({ where: { userId } }),
        this.prisma.roomPlayer.count({ where: { userId, hasBingo: true } }),
        this.prisma.roomPlayer.aggregate({
          where: { userId },
          _sum: { prize: true },
        }),
      ]);

      const losses = totalGames - wins;
      const winRate =
        totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

      return {
        totalGames,
        wins,
        losses,
        winRate,
        totalEarned: totalEarned._sum.prize ?? 0,
      };
    } catch {
      throw new InternalServerErrorException('Failed to fetch game stats');
    }
  }

  async getAgentStats(agentId: string) {
    try {
      const agent = await this.prisma.user.findFirst({
        where: { id: agentId, deletedAt: null },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          phone: true,
          email: true,
          coinsBalance: true,
          createdAt: true,
          role: true,
        },
      });
      if (!agent) throw new NotFoundException('Agent not found');

      const invite = await this.prisma.agentInvite.findFirst({
        where: { inviterId: agentId },
        include: {
          invitedUsers: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              createdAt: true,
            },
          },
        },
      });

      const invitedIds = invite?.invitedUsers.map((u) => u.id) ?? [];

      const [deposits, withdrawals] = await Promise.all([
        this.prisma.deposit.findMany({
          where: invitedIds.length
            ? { userId: { in: invitedIds } }
            : { id: 'none' },
          orderBy: { createdAt: 'desc' },
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
        }),
        this.prisma.withdrawal.findMany({
          where: invitedIds.length
            ? { userId: { in: invitedIds } }
            : { id: 'none' },
          orderBy: { createdAt: 'desc' },
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
        }),
      ]);

      const totalDepositCoins = deposits
        .filter((d) => d.status === 'COMPLETED')
        .reduce((s, d) => s + Number(d.amount), 0);
      const totalWithdrawalCoins = withdrawals
        .filter((w) => w.status === 'COMPLETED')
        .reduce((s, w) => s + Number(w.amount), 0);
      const pendingDeposits = deposits.filter(
        (d) => d.status === 'PENDING',
      ).length;
      const pendingWithdrawals = withdrawals.filter(
        (w) => w.status === 'PENDING' || w.status === 'PROCESSING',
      ).length;

      return {
        agent: this.serializeUser(agent),
        invite: invite
          ? {
              code: invite.code,
              status: invite.status,
              commission: invite.commission,
              usedAt: invite.usedAt,
            }
          : null,
        invitedUsers:
          invite?.invitedUsers.map((user) => this.serializeUser(user)) ?? [],
        deposits: deposits.map((deposit) => ({
          ...deposit,
          user: deposit.user ? this.serializeUser(deposit.user) : deposit.user,
        })),
        withdrawals: withdrawals.map((withdrawal) => ({
          ...withdrawal,
          user: withdrawal.user
            ? this.serializeUser(withdrawal.user)
            : withdrawal.user,
        })),
        summary: {
          totalInvited: invitedIds.length,
          totalDepositCoins,
          totalWithdrawalCoins,
          pendingDeposits,
          pendingWithdrawals,
          totalDeposits: deposits.length,
          totalWithdrawals: withdrawals.length,
          commission: invite?.commission ?? 0,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to fetch agent stats');
    }
  }

  async completeOnboarding(userId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { onboardingDone: true },
      select: userSelect,
    });
    return this.serializeUser(user);
  }

  async adjustCoins(id: string, amount: number, note: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');
    if (amount < 0 && user.coinsBalance + amount < 0) {
      throw new BadRequestException('Adjustment would make balance negative');
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const u = await tx.user.update({
        where: { id },
        data: { coinsBalance: { increment: amount } },
        select: { coinsBalance: true },
      });
      const wallet = await tx.wallet.findFirst({
        where: { userId: id, isDefault: true, deletedAt: null },
      });
      if (wallet) {
        await tx.transaction.create({
          data: {
            title: note || (amount >= 0 ? 'Admin credit' : 'Admin debit'),
            amount: Math.abs(amount),
            type: amount >= 0 ? 'INCOME' : 'EXPENSE',
            date: new Date(),
            userId: id,
            walletId: wallet.id,
          },
        });
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: amount } },
        });
      }
      return u;
    });
    return { newBalance: updated.coinsBalance };
  }

  async banUser(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: userSelect,
    });
  }

  async unbanUser(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: null },
      select: userSelect,
    });
  }

  async getLeaderboard(limit = 10) {
    try {
      const players = await this.prisma.roomPlayer.groupBy({
        by: ['userId'],
        _sum: { prize: true },
        _count: { hasBingo: true },
        orderBy: { _sum: { prize: 'desc' } },
        take: limit,
      });

      const userIds = players.map((p) => p.userId);
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

      const userMap = new Map<string, (typeof users)[number]>(
        users.map((u) => [u.id, u]),
      );

      return players.map((p, i) => ({
        rank: i + 1,
        user: userMap.get(p.userId)
          ? this.serializeUser(userMap.get(p.userId)!)
          : null,
        totalEarned: p._sum.prize ?? 0,
        wins: p._count.hasBingo,
      }));
    } catch {
      throw new InternalServerErrorException('Failed to fetch leaderboard');
    }
  }

  private getPublicApiUrl() {
    return getPublicApiUrl(this.configService);
  }

  private toPublicAssetUrl(path: string | null) {
    return toPublicAssetUrl(path, this.getPublicApiUrl());
  }

  private serializeUser<T extends { avatar: string | null }>(user: T): T {
    return {
      ...user,
      avatar: this.toPublicAssetUrl(user.avatar),
    };
  }
}
