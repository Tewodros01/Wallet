import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { MissionType, TransactionType } from 'generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class MissionsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMissions(userId: string, type?: MissionType) {
    const missions = await this.prisma.mission.findMany({
      where: { isActive: true, ...(type ? { type } : {}) },
      include: {
        userMissions: {
          where: { userId },
          select: { progress: true, claimed: true, claimedAt: true },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    return missions.map((m) => {
      const um = m.userMissions[0];
      return {
        id: m.id,
        title: m.title,
        desc: m.desc,
        reward: m.reward,
        total: m.total,
        type: m.type,
        category: m.category,
        icon: m.icon,
        progress: um?.progress ?? 0,
        claimed: um?.claimed ?? false,
        claimedAt: um?.claimedAt ?? null,
      };
    });
  }

  async claimMission(missionId: string, userId: string) {
    const mission = await this.prisma.mission.findUnique({
      where: { id: missionId },
    });
    if (!mission) throw new NotFoundException('Mission not found');

    const um = await this.prisma.userMission.findUnique({
      where: { userId_missionId: { userId, missionId } },
    });

    if (!um || um.progress < mission.total)
      throw new BadRequestException('Mission not completed yet');
    if (um.claimed) throw new BadRequestException('Already claimed');

    return this.prisma.$transaction(async (tx) => {
      await tx.userMission.update({
        where: { userId_missionId: { userId, missionId } },
        data: { claimed: true, claimedAt: new Date() },
      });
      await tx.user.update({
        where: { id: userId },
        data: { coinsBalance: { increment: mission.reward } },
      });

      const wallet = await tx.wallet.findFirst({
        where: { userId, isDefault: true, deletedAt: null },
      });
      if (wallet) {
        await tx.transaction.create({
          data: {
            title: `Mission reward: ${mission.title}`,
            amount: mission.reward,
            type: TransactionType.INCOME,
            date: new Date(),
            userId,
            walletId: wallet.id,
          },
        });
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: mission.reward } },
        });
      }

      await tx.notification.create({
        data: {
          userId,
          type: 'MISSION',
          title: 'Mission Reward Claimed!',
          body: `You claimed ${mission.reward} coins for "${mission.title}" 🎯`,
        },
      });

      const updated = await tx.user.findUnique({
        where: { id: userId },
        select: { coinsBalance: true },
      });
      return {
        success: true,
        reward: mission.reward,
        newBalance: updated?.coinsBalance ?? 0,
      };
    });
  }

  async incrementProgress(userId: string, missionId: string, amount = 1) {
    const mission = await this.prisma.mission.findUnique({
      where: { id: missionId },
    });
    if (!mission) throw new NotFoundException('Mission not found');

    const um = await this.prisma.userMission.upsert({
      where: { userId_missionId: { userId, missionId } },
      create: { userId, missionId, progress: Math.min(amount, mission.total) },
      update: { progress: { increment: amount } },
    });

    if (um.progress >= mission.total && !um.claimed) {
      await this.prisma.notification.create({
        data: {
          userId,
          type: 'MISSION',
          title: 'Mission Complete!',
          body: `"${mission.title}" is complete. Claim your ${mission.reward} coins! 🎯`,
        },
      });
    }
    return um;
  }

  async getStreak(userId: string) {
    try {
      // Count consecutive days with at least one game played
      const recentGames = await this.prisma.roomPlayer.findMany({
        where: { userId },
        select: { joinedAt: true },
        orderBy: { joinedAt: 'desc' },
        take: 100,
      });

      const days = new Set(recentGames.map((g) => g.joinedAt.toDateString()));
      let streak = 0;
      const today = new Date();
      for (let i = 0; i < 30; i++) {
        const d = new Date(today);
        d.setDate(d.getDate() - i);
        if (days.has(d.toDateString())) streak++;
        else break;
      }
      return { streak };
    } catch {
      throw new InternalServerErrorException('Failed to fetch streak');
    }
  }

  async createMission(dto: {
    title: string;
    desc: string;
    reward: number;
    total: number;
    type: string;
    category: string;
    icon?: string;
  }) {
    return this.prisma.mission.create({
      data: {
        title: dto.title,
        desc: dto.desc,
        reward: dto.reward,
        total: dto.total,
        type: dto.type as MissionType,
        category: dto.category as any,
        icon: dto.icon ?? '🎯',
      },
    });
  }

  async updateMission(
    id: string,
    dto: Partial<{
      title: string;
      desc: string;
      reward: number;
      total: number;
      isActive: boolean;
      icon: string;
    }>,
  ) {
    const mission = await this.prisma.mission.findUnique({ where: { id } });
    if (!mission) throw new NotFoundException('Mission not found');
    return this.prisma.mission.update({ where: { id }, data: dto });
  }

  async deleteMission(id: string) {
    const mission = await this.prisma.mission.findUnique({ where: { id } });
    if (!mission) throw new NotFoundException('Mission not found');
    await this.prisma.mission.delete({ where: { id } });
    return { success: true };
  }

  async seedMissions() {
    const existing = await this.prisma.mission.count();
    if (existing > 0) return { message: 'Already seeded' };

    const missions = [
      {
        title: 'Play 1 Game',
        desc: 'Join and complete any bingo room',
        reward: 50,
        total: 1,
        type: MissionType.DAILY,
        category: 'PLAY_GAMES' as const,
        icon: '🎮',
      },
      {
        title: 'Win a Game',
        desc: 'Get bingo in any room',
        reward: 100,
        total: 1,
        type: MissionType.DAILY,
        category: 'WIN_GAMES' as const,
        icon: '🏆',
      },
      {
        title: 'Play 3 Games',
        desc: 'Complete 3 bingo games today',
        reward: 150,
        total: 3,
        type: MissionType.DAILY,
        category: 'PLAY_GAMES' as const,
        icon: '🎯',
      },
      {
        title: 'Invite a Friend',
        desc: 'Share your referral link today',
        reward: 200,
        total: 1,
        type: MissionType.DAILY,
        category: 'INVITE' as const,
        icon: '👥',
      },
      {
        title: 'Top Up Coins',
        desc: 'Make any deposit today',
        reward: 75,
        total: 1,
        type: MissionType.DAILY,
        category: 'DEPOSIT' as const,
        icon: '💳',
      },
      {
        title: 'Win 5 Games',
        desc: 'Win 5 bingo games this week',
        reward: 500,
        total: 5,
        type: MissionType.WEEKLY,
        category: 'WIN_GAMES' as const,
        icon: '🥇',
      },
      {
        title: 'Play 20 Games',
        desc: 'Complete 20 games this week',
        reward: 800,
        total: 20,
        type: MissionType.WEEKLY,
        category: 'PLAY_GAMES' as const,
        icon: '🎲',
      },
      {
        title: 'Join Tournament',
        desc: 'Register for any tournament',
        reward: 300,
        total: 1,
        type: MissionType.WEEKLY,
        category: 'TOURNAMENT' as const,
        icon: '🏟️',
      },
      {
        title: 'Invite 3 Friends',
        desc: 'Get 3 friends to sign up',
        reward: 1000,
        total: 3,
        type: MissionType.WEEKLY,
        category: 'INVITE' as const,
        icon: '🤝',
      },
      {
        title: 'Play Keno',
        desc: 'Play 5 rounds of Keno',
        reward: 400,
        total: 5,
        type: MissionType.WEEKLY,
        category: 'KENO' as const,
        icon: '🎰',
      },
    ];

    await this.prisma.mission.createMany({ data: missions });
    return { message: 'Seeded successfully', count: missions.length };
  }
}
