import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AgentStatus,
  MissionCategory,
  TransactionType,
} from 'generated/prisma/client';
import { normalizeAvatarUrls } from '../common/utils/avatar-url.util';
import { LedgerService } from '../ledger/ledger.service';
import { MissionsService } from '../missions/missions.service';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';

const COMMISSION_PER_INVITE = 50; // coins on signup
const DEPOSIT_COMMISSION_PCT = 0.02; // 2% of deposit amount credited to inviter

@Injectable()
export class AgentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly missionsService: MissionsService,
    private readonly configService: ConfigService,
    private readonly telegramService: TelegramService,
    private readonly ledgerService: LedgerService,
  ) {}

  async getMyInvite(userId: string) {
    try {
      let invite = await this.prisma.agentInvite.findFirst({
        where: { inviterId: userId },
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

      if (!invite) {
        invite = await this.prisma.agentInvite.create({
          data: {
            inviterId: userId,
            code: this.generateCode(userId),
            status: AgentStatus.ACTIVE,
          },
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
      }

      return normalizeAvatarUrls(
        invite,
        this.configService.get<string>(
          'publicApiUrl',
          `http://localhost:${this.configService.get<number>('port', 3000)}`,
        ),
      );
    } catch {
      throw new InternalServerErrorException('Failed to fetch invite');
    }
  }

  async useInviteCode(code: string, newUserId: string) {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const invite = await tx.agentInvite.findUnique({
          where: { code },
          include: { invitedUsers: { select: { id: true } } },
        });
        const user = await tx.user.findUnique({
          where: { id: newUserId },
          select: { id: true, referredById: true },
        });

        if (!invite) throw new NotFoundException('Invalid invite code');
        if (!user) throw new NotFoundException('User not found');
        if (invite.status !== AgentStatus.ACTIVE)
          throw new BadRequestException('Invite code is no longer active');
        if (invite.expiresAt && invite.expiresAt < new Date())
          throw new BadRequestException('Invite code has expired');
        if (invite.invitedUsers.some((u) => u.id === newUserId))
          throw new BadRequestException('Already used this code');
        if (invite.inviterId === newUserId)
          throw new BadRequestException('Cannot use your own invite code');
        if (user.referredById)
          throw new BadRequestException('Referral code already applied');

        // link user to invite
        await tx.user.update({
          where: { id: newUserId },
          data: { referredById: invite.id },
        });

        // credit commission to inviter
        await tx.agentInvite.update({
          where: { id: invite.id },
          data: {
            commission: { increment: COMMISSION_PER_INVITE },
            usedAt: new Date(),
          },
        });

        await this.ledgerService.applyEntry(tx, {
          userId: invite.inviterId,
          title: 'Referral Bonus',
          amount: COMMISSION_PER_INVITE,
          balanceDelta: COMMISSION_PER_INVITE,
          type: TransactionType.REFERRAL_BONUS,
        });

        return {
          success: true,
          commission: COMMISSION_PER_INVITE,
          inviterId: invite.inviterId,
        };
      });

      void this.missionsService
        .incrementCategoryProgress(result.inviterId, MissionCategory.INVITE)
        .catch(() => {});
      void this.telegramService.trySendMessageToUser(
        result.inviterId,
        `Referral bonus unlocked. You earned ${result.commission.toLocaleString()} coins from a new signup.`,
      );

      return {
        success: true,
        commission: result.commission,
      };
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new InternalServerErrorException('Failed to apply invite code');
    }
  }

  async creditDepositCommission(
    depositedUserId: string,
    depositAmount: number,
  ) {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: depositedUserId },
        select: { referredById: true },
      });
      if (!user?.referredById) return; // not referred, skip

      const invite = await this.prisma.agentInvite.findUnique({
        where: { id: user.referredById },
        select: { id: true, inviterId: true },
      });
      if (!invite) return;

      const commission = Math.floor(depositAmount * DEPOSIT_COMMISSION_PCT);
      if (commission <= 0) return;

      await this.prisma.$transaction(async (tx) => {
        await tx.agentInvite.update({
          where: { id: invite.id },
          data: { commission: { increment: commission } },
        });
        await this.ledgerService.applyEntry(tx, {
          userId: invite.inviterId,
          title: `Agent commission (2% of deposit)`,
          amount: commission,
          balanceDelta: commission,
          type: TransactionType.AGENT_COMMISSION,
        });
      });
      void this.telegramService.trySendMessageToUser(
        invite.inviterId,
        `Agent commission received. You earned ${commission.toLocaleString()} coins from a referred user's deposit.`,
      );
    } catch {
      // commission is non-critical — never fail the main deposit flow
    }
  }

  async getAgentStats(userId: string) {
    try {
      const invite = await this.prisma.agentInvite.findFirst({
        where: { inviterId: userId },
        include: { invitedUsers: { select: { id: true } } },
      });

      if (!invite) return { totalInvited: 0, commission: 0, code: null };

      return {
        totalInvited: invite.invitedUsers.length,
        commission: invite.commission,
        code: invite.code,
        status: invite.status,
      };
    } catch {
      throw new InternalServerErrorException('Failed to fetch agent stats');
    }
  }

  private generateCode(userId: string): string {
    const prefix = userId.slice(-4).toUpperCase();
    const suffix = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `${prefix}-${suffix}`;
  }
}
