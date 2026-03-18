import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AgentStatus, TransactionType } from 'generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';

const COMMISSION_PER_INVITE = 50; // coins

@Injectable()
export class AgentsService {
  constructor(private readonly prisma: PrismaService) {}

  async getMyInvite(userId: string) {
    try {
      let invite = await this.prisma.agentInvite.findFirst({
        where: { inviterId: userId },
        include: {
          invitedUsers: {
            select: { id: true, username: true, firstName: true, lastName: true, avatar: true, createdAt: true },
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
              select: { id: true, username: true, firstName: true, lastName: true, avatar: true, createdAt: true },
            },
          },
        });
      }

      return invite;
    } catch {
      throw new InternalServerErrorException('Failed to fetch invite');
    }
  }

  async useInviteCode(code: string, newUserId: string) {
    try {
      const invite = await this.prisma.agentInvite.findUnique({
        where: { code },
        include: { invitedUsers: { select: { id: true } } },
      });

      if (!invite) throw new NotFoundException('Invalid invite code');
      if (invite.status !== AgentStatus.ACTIVE) throw new BadRequestException('Invite code is no longer active');
      if (invite.expiresAt && invite.expiresAt < new Date()) throw new BadRequestException('Invite code has expired');
      if (invite.invitedUsers.some((u) => u.id === newUserId)) throw new BadRequestException('Already used this code');
      if (invite.inviterId === newUserId) throw new BadRequestException('Cannot use your own invite code');

      return await this.prisma.$transaction(async (tx) => {
        // link user to invite
        await tx.user.update({
          where: { id: newUserId },
          data: { referredById: invite.id },
        });

        // credit commission to inviter
        await tx.agentInvite.update({
          where: { id: invite.id },
          data: { commission: { increment: COMMISSION_PER_INVITE }, usedAt: new Date() },
        });

        await tx.user.update({
          where: { id: invite.inviterId },
          data: { coinsBalance: { increment: COMMISSION_PER_INVITE } },
        });

        // record referral bonus transaction
        const wallet = await tx.wallet.findFirst({
          where: { userId: invite.inviterId, isDefault: true, deletedAt: null },
        });
        if (wallet) {
          await tx.transaction.create({
            data: {
              title: 'Referral Bonus',
              amount: COMMISSION_PER_INVITE,
              type: TransactionType.REFERRAL_BONUS,
              date: new Date(),
              userId: invite.inviterId,
              walletId: wallet.id,
            },
          });
        }

        return { success: true, commission: COMMISSION_PER_INVITE };
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to apply invite code');
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
