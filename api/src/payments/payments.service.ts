import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { DepositStatus, TransactionType, WithdrawalStatus } from 'generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepositDto, CreateWithdrawalDto } from './dto/payment.dto';

@Injectable()
export class PaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  // ── Deposits ──────────────────────────────────────────────────────────────

  async createDeposit(dto: CreateDepositDto, userId: string) {
    try {
      // Create as PENDING — agent must approve before coins are credited
      return await this.prisma.deposit.create({
        data: { userId, amount: dto.amount, method: dto.method, reference: dto.reference },
      });
    } catch {
      throw new InternalServerErrorException('Failed to create deposit request');
    }
  }

  async getAgents() {
    return this.prisma.user.findMany({
      where: { role: 'AGENT' },
      select: { id: true, firstName: true, lastName: true, username: true, avatar: true, phone: true },
    });
  }

  async getDeposits(userId: string) {
    return this.prisma.deposit.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Withdrawals ───────────────────────────────────────────────────────────

  async createWithdrawal(dto: CreateWithdrawalDto, userId: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({ where: { id: userId }, select: { coinsBalance: true } });
        if (!user || user.coinsBalance < dto.amount) {
          throw new BadRequestException('Insufficient coin balance');
        }

        const withdrawal = await tx.withdrawal.create({
          data: {
            userId,
            amount: dto.amount,
            method: dto.method,
            accountNumber: dto.accountNumber,
            status: WithdrawalStatus.PENDING,
          },
        });

        // deduct coins immediately, mark as processing
        await tx.user.update({
          where: { id: userId },
          data: { coinsBalance: { decrement: dto.amount } },
        });

        await tx.withdrawal.update({
          where: { id: withdrawal.id },
          data: { status: WithdrawalStatus.PROCESSING, processedAt: new Date() },
        });

        const wallet = await tx.wallet.findFirst({
          where: { userId, isDefault: true, deletedAt: null },
        });

        if (wallet) {
          await tx.transaction.create({
            data: {
              title: `Withdrawal to ${dto.method}`,
              amount: dto.amount,
              type: TransactionType.WITHDRAWAL,
              date: new Date(),
              userId,
              walletId: wallet.id,
            },
          });
          await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: { decrement: dto.amount } },
          });
        }

        return { ...withdrawal, status: WithdrawalStatus.PROCESSING };
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to process withdrawal');
    }
  }

  async getWithdrawals(userId: string) {
    return this.prisma.withdrawal.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ── Daily Bonus ───────────────────────────────────────────────────────────

  async claimDailyBonus(userId: string, coins: number) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        await tx.user.update({
          where: { id: userId },
          data: { coinsBalance: { increment: coins } },
        });
        const wallet = await tx.wallet.findFirst({ where: { userId, isDefault: true, deletedAt: null } });
        if (wallet) {
          await tx.transaction.create({
            data: {
              title: 'Daily Bonus Spin',
              amount: coins,
              type: TransactionType.INCOME,
              date: new Date(),
              userId,
              walletId: wallet.id,
            },
          });
          await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: coins } } });
        }
        const updated = await tx.user.findUnique({ where: { id: userId }, select: { coinsBalance: true } });
        return { coins, newBalance: updated?.coinsBalance ?? 0 };
      });
    } catch {
      throw new InternalServerErrorException('Failed to claim daily bonus');
    }
  }

  // ── Agent: approve/reject deposits & withdrawals ──────────────────────────

  async agentApproveDeposit(depositId: string) {
    try {
      const deposit = await this.prisma.deposit.findUnique({ where: { id: depositId } });
      if (!deposit) throw new BadRequestException('Deposit not found');
      if (deposit.status !== DepositStatus.PENDING) throw new BadRequestException('Already processed');
      return await this.prisma.$transaction(async (tx) => {
        await tx.deposit.update({ where: { id: depositId }, data: { status: DepositStatus.COMPLETED, completedAt: new Date() } });
        await tx.user.update({ where: { id: deposit.userId }, data: { coinsBalance: { increment: deposit.amount } } });
        const wallet = await tx.wallet.findFirst({ where: { userId: deposit.userId, isDefault: true, deletedAt: null } });
        if (wallet) {
          await tx.transaction.create({ data: { title: `Deposit via ${deposit.method}`, amount: deposit.amount, type: TransactionType.DEPOSIT, date: new Date(), userId: deposit.userId, walletId: wallet.id } });
          await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: deposit.amount } } });
        }
        return { success: true };
      });
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to approve deposit');
    }
  }

  async agentRejectDeposit(depositId: string) {
    try {
      const deposit = await this.prisma.deposit.findUnique({ where: { id: depositId } });
      if (!deposit) throw new BadRequestException('Deposit not found');
      if (deposit.status !== DepositStatus.PENDING) throw new BadRequestException('Already processed');
      await this.prisma.deposit.update({ where: { id: depositId }, data: { status: DepositStatus.FAILED } });
      return { success: true };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to reject deposit');
    }
  }

  async agentApproveWithdrawal(withdrawalId: string) {
    try {
      const w = await this.prisma.withdrawal.findUnique({ where: { id: withdrawalId } });
      if (!w) throw new BadRequestException('Withdrawal not found');
      if (w.status !== WithdrawalStatus.PROCESSING && w.status !== WithdrawalStatus.PENDING) throw new BadRequestException('Already processed');
      await this.prisma.withdrawal.update({ where: { id: withdrawalId }, data: { status: WithdrawalStatus.COMPLETED, completedAt: new Date() } });
      return { success: true };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to approve withdrawal');
    }
  }

  async agentRejectWithdrawal(withdrawalId: string) {
    try {
      const w = await this.prisma.withdrawal.findUnique({ where: { id: withdrawalId } });
      if (!w) throw new BadRequestException('Withdrawal not found');
      if (w.status !== WithdrawalStatus.PROCESSING && w.status !== WithdrawalStatus.PENDING) throw new BadRequestException('Already processed');
      // refund coins
      await this.prisma.$transaction(async (tx) => {
        await tx.withdrawal.update({ where: { id: withdrawalId }, data: { status: WithdrawalStatus.FAILED } });
        await tx.user.update({ where: { id: w.userId }, data: { coinsBalance: { increment: w.amount } } });
        const wallet = await tx.wallet.findFirst({ where: { userId: w.userId, isDefault: true, deletedAt: null } });
        if (wallet) await tx.wallet.update({ where: { id: wallet.id }, data: { balance: { increment: w.amount } } });
      });
      return { success: true };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to reject withdrawal');
    }
  }

  async getAgentRequests(agentUserId: string) {
    // Return all pending deposits and withdrawals (in a real app, scoped to agent's users)
    const [deposits, withdrawals] = await Promise.all([
      this.prisma.deposit.findMany({ orderBy: { createdAt: 'desc' }, take: 50, include: { user: { select: { id: true, username: true, firstName: true, lastName: true, avatar: true } } } }),
      this.prisma.withdrawal.findMany({ orderBy: { createdAt: 'desc' }, take: 50, include: { user: { select: { id: true, username: true, firstName: true, lastName: true, avatar: true } } } }),
    ]);
    return { deposits, withdrawals };
  }
}
