import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import * as fs from 'fs';
import { Prisma, Role } from 'generated/prisma/client';
import * as path from 'path';
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
  constructor(private readonly prisma: PrismaService) {}

  async findAll() {
    return this.prisma.user.findMany({
      where: { deletedAt: null },
      select: { ...userSelect, role: true },
      orderBy: { createdAt: 'desc' },
    });
  }

  async updateRole(id: string, role: Role) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');
    return this.prisma.user.update({
      where: { id },
      data: { role },
      select: userSelect,
    });
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: userSelect,
    });
    if (!user) throw new NotFoundException('User not found');
    return user;
  }

  async update(id: string, dto: UpdateUserDto) {
    try {
      return await this.prisma.user.update({
        where: { id },
        data: dto,
        select: userSelect,
      });
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
    if (!file) throw new BadRequestException('No file provided');

    // Save to /public/avatars — in production swap this for S3/Cloudinary
    const uploadsDir = path.join(process.cwd(), 'public', 'avatars');
    if (!fs.existsSync(uploadsDir))
      fs.mkdirSync(uploadsDir, { recursive: true });

    const ext = path.extname(file.originalname) || '.jpg';
    const filename = `${userId}-${crypto.randomBytes(6).toString('hex')}${ext}`;
    const filepath = path.join(uploadsDir, filename);
    fs.writeFileSync(filepath, file.buffer);

    const avatarUrl = `/public/avatars/${filename}`;
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: userSelect,
    });
    return { avatarUrl, user };
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
        agent,
        invite: invite
          ? {
              code: invite.code,
              status: invite.status,
              commission: invite.commission,
              usedAt: invite.usedAt,
            }
          : null,
        invitedUsers: invite?.invitedUsers ?? [],
        deposits,
        withdrawals,
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
    return this.prisma.user.update({
      where: { id: userId },
      data: { onboardingDone: true },
      select: userSelect,
    });
  }

  async adjustCoins(id: string, amount: number, note: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');
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

      const userMap = new Map(users.map((u) => [u.id, u]));

      return players.map((p, i) => ({
        rank: i + 1,
        user: userMap.get(p.userId),
        totalEarned: p._sum.prize ?? 0,
        wins: p._count.hasBingo,
      }));
    } catch {
      throw new InternalServerErrorException('Failed to fetch leaderboard');
    }
  }
}
