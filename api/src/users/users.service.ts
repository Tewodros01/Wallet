import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
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
  createdAt: true,
} as const;

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

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
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
        const target = (error.meta?.target as string[]) ?? [];
        if (target.includes('username')) throw new ConflictException('Username already taken');
        if (target.includes('phone')) throw new ConflictException('Phone already in use');
      }
      throw new InternalServerErrorException('Failed to update profile');
    }
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
      const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

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
        select: { id: true, username: true, firstName: true, lastName: true, avatar: true },
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
