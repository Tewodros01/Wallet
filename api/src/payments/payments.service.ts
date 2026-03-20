import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  DepositStatus,
  MissionCategory,
  NotificationType,
  TransactionType,
  WithdrawalStatus,
} from 'generated/prisma/client';
import { AgentsService } from '../agents/agents.service';
import { normalizeAvatarUrls } from '../common/utils/avatar-url.util';
import { MissionsService } from '../missions/missions.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { PrismaService } from '../prisma/prisma.service';
import { TelegramService } from '../telegram/telegram.service';
import { CreateDepositDto, CreateWithdrawalDto } from './dto/payment.dto';

const MIN_DEPOSIT = 10;
const MAX_DEPOSIT = 1_000_000;
const MIN_WITHDRAWAL = 50;
const MAX_WITHDRAWAL = 500_000;
const DAILY_BONUS_PRIZES = [25, 50, 75, 100, 200, 300, 500, 1000] as const;

const KENO_PAYOUTS: Record<number, Record<number, number>> = {
  1: { 1: 3 },
  2: { 2: 12 },
  3: { 2: 2, 3: 40 },
  4: { 2: 1, 3: 5, 4: 100 },
  5: { 3: 3, 4: 20, 5: 500 },
  6: { 3: 2, 4: 8, 5: 100, 6: 1500 },
  7: { 3: 1, 4: 5, 5: 40, 6: 400, 7: 5000 },
  8: { 4: 3, 5: 20, 6: 100, 7: 1000, 8: 10000 },
  9: { 4: 2, 5: 10, 6: 50, 7: 500, 8: 5000, 9: 25000 },
  10: { 5: 5, 6: 20, 7: 100, 8: 1000, 9: 10000, 10: 100000 },
};

@Injectable()
export class PaymentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly agentsService: AgentsService,
    private readonly missionsService: MissionsService,
    private readonly notifGateway: NotificationsGateway,
    private readonly configService: ConfigService,
    private readonly telegramService: TelegramService,
  ) {}

  // ── Deposits ──────────────────────────────────────────────────────────────

  async createDeposit(dto: CreateDepositDto, userId: string) {
    if (dto.amount < MIN_DEPOSIT)
      throw new BadRequestException(`Minimum deposit is ${MIN_DEPOSIT} coins`);
    if (dto.amount > MAX_DEPOSIT)
      throw new BadRequestException(
        `Maximum deposit is ${MAX_DEPOSIT.toLocaleString()} coins`,
      );
    try {
      return await this.prisma.deposit.create({
        data: {
          userId,
          amount: dto.amount,
          method: dto.method,
          reference: dto.reference,
          proofUrl: dto.proofUrl,
        },
      });
    } catch {
      throw new InternalServerErrorException(
        'Failed to create deposit request',
      );
    }
  }

  async getAgents() {
    const agents = await this.prisma.user.findMany({
      where: { role: 'AGENT' },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        username: true,
        avatar: true,
        phone: true,
      },
    });

    return normalizeAvatarUrls(
      agents,
      this.configService.get<string>(
        'publicApiUrl',
        `http://localhost:${this.configService.get<number>('port', 3000)}`,
      ),
    );
  }

  async transferCoins(
    senderId: string,
    recipientUsername: string,
    amount: number,
  ) {
    if (amount <= 0) throw new BadRequestException('Amount must be positive');
    return this.prisma.$transaction(async (tx) => {
      const sender = await tx.user.findUnique({
        where: { id: senderId },
        select: { coinsBalance: true, firstName: true },
      });
      if (!sender) throw new BadRequestException('Sender not found');
      if (sender.coinsBalance < amount)
        throw new BadRequestException('Insufficient coin balance');

      const recipient = await tx.user.findFirst({
        where: { username: recipientUsername, deletedAt: null },
        select: { id: true, firstName: true },
      });
      if (!recipient) throw new BadRequestException('Recipient not found');
      if (recipient.id === senderId)
        throw new BadRequestException('Cannot transfer to yourself');

      await tx.user.update({
        where: { id: senderId },
        data: { coinsBalance: { decrement: amount } },
      });
      await tx.user.update({
        where: { id: recipient.id },
        data: { coinsBalance: { increment: amount } },
      });

      const sWallet = await tx.wallet.findFirst({
        where: { userId: senderId, isDefault: true, deletedAt: null },
      });
      const rWallet = await tx.wallet.findFirst({
        where: { userId: recipient.id, isDefault: true, deletedAt: null },
      });
      if (sWallet) {
        await tx.transaction.create({
          data: {
            title: `Transfer to @${recipientUsername}`,
            amount,
            type: TransactionType.TRANSFER,
            date: new Date(),
            userId: senderId,
            walletId: sWallet.id,
          },
        });
        await tx.wallet.update({
          where: { id: sWallet.id },
          data: { balance: { decrement: amount } },
        });
      }
      if (rWallet) {
        await tx.transaction.create({
          data: {
            title: `Transfer from @${sender.firstName}`,
            amount,
            type: TransactionType.INCOME,
            date: new Date(),
            userId: recipient.id,
            walletId: rWallet.id,
          },
        });
        await tx.wallet.update({
          where: { id: rWallet.id },
          data: { balance: { increment: amount } },
        });
      }
      return { success: true, recipient: recipient.firstName };
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
    if (dto.amount < MIN_WITHDRAWAL)
      throw new BadRequestException(
        `Minimum withdrawal is ${MIN_WITHDRAWAL} coins`,
      );
    if (dto.amount > MAX_WITHDRAWAL)
      throw new BadRequestException(
        `Maximum withdrawal is ${MAX_WITHDRAWAL.toLocaleString()} coins`,
      );
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { coinsBalance: true },
        });
        if (!user || user.coinsBalance < dto.amount)
          throw new BadRequestException('Insufficient coin balance');

        const withdrawal = await tx.withdrawal.create({
          data: {
            userId,
            amount: dto.amount,
            method: dto.method,
            accountNumber: dto.accountNumber,
            status: WithdrawalStatus.PENDING,
          },
        });

        await tx.user.update({
          where: { id: userId },
          data: { coinsBalance: { decrement: dto.amount } },
        });
        await tx.withdrawal.update({
          where: { id: withdrawal.id },
          data: {
            status: WithdrawalStatus.PROCESSING,
            processedAt: new Date(),
          },
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

      void this.telegramService.trySendMessageToUser(
        userId,
        `Your daily bonus is in. You received ${result.coins.toLocaleString()} coins and your new balance is ${result.newBalance.toLocaleString()} coins.`,
      );

      return result;
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

  async claimDailyBonus(userId: string) {
    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const coins =
          DAILY_BONUS_PRIZES[
            Math.floor(Math.random() * DAILY_BONUS_PRIZES.length)
          ];

        // enforce 24-hour cooldown
        const lastBonus = await tx.transaction.findFirst({
          where: { userId, title: 'Daily Bonus Spin' },
          orderBy: { createdAt: 'desc' },
        });
        if (lastBonus) {
          const diff = Date.now() - lastBonus.createdAt.getTime();
          if (diff < 24 * 60 * 60 * 1000) {
            const nextHrs = Math.ceil(
              (24 * 60 * 60 * 1000 - diff) / (60 * 60 * 1000),
            );
            throw new BadRequestException(
              `Daily bonus already claimed. Come back in ${nextHrs}h`,
            );
          }
        }

        await tx.user.update({
          where: { id: userId },
          data: { coinsBalance: { increment: coins } },
        });

        const wallet = await tx.wallet.findFirst({
          where: { userId, isDefault: true, deletedAt: null },
        });
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
          await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: { increment: coins } },
          });
        }

        const updated = await tx.user.findUnique({
          where: { id: userId },
          select: { coinsBalance: true },
        });
        return { coins, newBalance: updated?.coinsBalance ?? 0 };
      });

      return result;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to claim daily bonus');
    }
  }

  // ── Keno ──────────────────────────────────────────────────────────────────

  async playKeno(userId: string, bet: number, picks: number[]) {
    // validate picks before touching DB
    if (picks.length < 1 || picks.length > 10)
      throw new BadRequestException('Pick between 1 and 10 numbers');
    if (new Set(picks).size !== picks.length)
      throw new BadRequestException('Duplicate picks not allowed');
    if (picks.some((n) => n < 1 || n > 80))
      throw new BadRequestException('Picks must be between 1 and 80');
    if (bet <= 0) throw new BadRequestException('Bet must be positive');

    // server generates the draw — never trust client-supplied drawn numbers
    const pool = Array.from({ length: 80 }, (_, i) => i + 1);
    for (let i = pool.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const drawn = pool.slice(0, 20);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const user = await tx.user.findUnique({
          where: { id: userId },
          select: { coinsBalance: true },
        });
        if (!user || user.coinsBalance < bet)
          throw new BadRequestException('Insufficient coin balance');

        const drawnSet = new Set(drawn);
        const matches = picks.filter((n) => drawnSet.has(n)).length;
        const multiplier = KENO_PAYOUTS[picks.length]?.[matches] ?? 0;
        const payout = multiplier * bet;
        const net = payout - bet;

        await tx.user.update({
          where: { id: userId },
          data: { coinsBalance: { increment: net } },
        });

        const wallet = await tx.wallet.findFirst({
          where: { userId, isDefault: true, deletedAt: null },
        });
        if (wallet) {
          await tx.transaction.create({
            data: {
              title: `Keno — ${matches} match${matches !== 1 ? 'es' : ''} (${picks.length} picks)`,
              amount: Math.abs(net),
              type:
                net >= 0
                  ? TransactionType.GAME_WIN
                  : TransactionType.GAME_ENTRY,
              date: new Date(),
              userId,
              walletId: wallet.id,
            },
          });
          await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: { increment: net } },
          });
        }

        if (payout > 0) {
          await tx.notification
            .create({
              data: {
                userId,
                type: NotificationType.WIN,
                title: 'Keno Win! 🎰',
                body: `You matched ${matches}/${picks.length} numbers and won ${payout.toLocaleString()} coins!`,
              },
            })
            .catch(() => {});
        }

        const updated = await tx.user.findUnique({
          where: { id: userId },
          select: { coinsBalance: true },
        });
        return {
          matches,
          payout,
          bet,
          net,
          drawn,
          newBalance: updated?.coinsBalance ?? 0,
        };
      });

      void this.missionsService
        .incrementCategoryProgress(userId, MissionCategory.KENO)
        .catch(() => {});

      return result;
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to process Keno round');
    }
  }

  async getKenoHistory(userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId, title: { startsWith: 'Keno' } },
      orderBy: { createdAt: 'desc' },
      take: 50,
      select: {
        id: true,
        title: true,
        amount: true,
        type: true,
        createdAt: true,
      },
    });
  }

  // ── Agent: approve/reject deposits & withdrawals ──────────────────────────

  async agentApproveDeposit(depositId: string) {
    try {
      const deposit = await this.prisma.deposit.findUnique({
        where: { id: depositId },
      });
      if (!deposit) throw new BadRequestException('Deposit not found');
      if (deposit.status !== DepositStatus.PENDING)
        throw new BadRequestException('Already processed');
      await this.prisma.$transaction(async (tx) => {
        await tx.deposit.update({
          where: { id: depositId },
          data: { status: DepositStatus.COMPLETED, completedAt: new Date() },
        });
        await tx.user.update({
          where: { id: deposit.userId },
          data: { coinsBalance: { increment: deposit.amount } },
        });
        const wallet = await tx.wallet.findFirst({
          where: { userId: deposit.userId, isDefault: true, deletedAt: null },
        });
        if (wallet) {
          await tx.transaction.create({
            data: {
              title: `Deposit via ${deposit.method}`,
              amount: deposit.amount,
              type: TransactionType.DEPOSIT,
              date: new Date(),
              userId: deposit.userId,
              walletId: wallet.id,
            },
          });
          await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: { increment: deposit.amount } },
          });
        }
      });
      // credit referral commission non-blocking — never fails the main flow
      void this.agentsService.creditDepositCommission(
        deposit.userId,
        deposit.amount,
      );
      void this.missionsService
        .incrementCategoryProgress(deposit.userId, MissionCategory.DEPOSIT)
        .catch(() => {});
      // push real-time notification to user
      const notif = {
        type: NotificationType.DEPOSIT,
        title: 'Deposit Approved ✅',
        body: `Your deposit of ${Number(deposit.amount).toLocaleString()} coins has been approved and credited to your wallet.`,
      };
      await this.prisma.notification
        .create({ data: { userId: deposit.userId, ...notif } })
        .catch(() => {});
      this.notifGateway.pushToUser(deposit.userId, notif);
      void this.telegramService.trySendMessageToUser(
        deposit.userId,
        `Deposit approved. ${Number(deposit.amount).toLocaleString()} coins were credited to your wallet.`,
      );
      return { success: true };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to approve deposit');
    }
  }

  async agentRejectDeposit(depositId: string) {
    try {
      const deposit = await this.prisma.deposit.findUnique({
        where: { id: depositId },
      });
      if (!deposit) throw new BadRequestException('Deposit not found');
      if (deposit.status !== DepositStatus.PENDING)
        throw new BadRequestException('Already processed');
      await this.prisma.deposit.update({
        where: { id: depositId },
        data: { status: DepositStatus.FAILED },
      });
      const notif = {
        type: NotificationType.DEPOSIT,
        title: 'Deposit Rejected',
        body: `Your deposit request of ${Number(deposit.amount).toLocaleString()} coins was rejected. Please contact support if you believe this is an error.`,
      };
      await this.prisma.notification
        .create({ data: { userId: deposit.userId, ...notif } })
        .catch(() => {});
      this.notifGateway.pushToUser(deposit.userId, notif);
      void this.telegramService.trySendMessageToUser(
        deposit.userId,
        `Deposit rejected. Your request for ${Number(deposit.amount).toLocaleString()} coins was not approved. Please contact support if needed.`,
      );
      return { success: true };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to reject deposit');
    }
  }

  async agentApproveWithdrawal(withdrawalId: string) {
    try {
      const w = await this.prisma.withdrawal.findUnique({
        where: { id: withdrawalId },
      });
      if (!w) throw new BadRequestException('Withdrawal not found');
      if (
        w.status !== WithdrawalStatus.PROCESSING &&
        w.status !== WithdrawalStatus.PENDING
      )
        throw new BadRequestException('Already processed');
      await this.prisma.withdrawal.update({
        where: { id: withdrawalId },
        data: { status: WithdrawalStatus.COMPLETED, completedAt: new Date() },
      });
      const notif = {
        type: NotificationType.WITHDRAWAL,
        title: 'Withdrawal Approved ✅',
        body: `Your withdrawal of ${Number(w.amount).toLocaleString()} coins has been approved. Cash will be sent to your account shortly.`,
      };
      await this.prisma.notification
        .create({ data: { userId: w.userId, ...notif } })
        .catch(() => {});
      this.notifGateway.pushToUser(w.userId, notif);
      void this.telegramService.trySendMessageToUser(
        w.userId,
        `Withdrawal approved. ${Number(w.amount).toLocaleString()} coins will be sent to your ${w.method} account shortly.`,
      );
      return { success: true };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to approve withdrawal');
    }
  }

  async agentRejectWithdrawal(withdrawalId: string) {
    try {
      const w = await this.prisma.withdrawal.findUnique({
        where: { id: withdrawalId },
      });
      if (!w) throw new BadRequestException('Withdrawal not found');
      if (
        w.status !== WithdrawalStatus.PROCESSING &&
        w.status !== WithdrawalStatus.PENDING
      )
        throw new BadRequestException('Already processed');
      await this.prisma.$transaction(async (tx) => {
        await tx.withdrawal.update({
          where: { id: withdrawalId },
          data: { status: WithdrawalStatus.REJECTED },
        });
        await tx.user.update({
          where: { id: w.userId },
          data: { coinsBalance: { increment: w.amount } },
        });
        const wallet = await tx.wallet.findFirst({
          where: { userId: w.userId, isDefault: true, deletedAt: null },
        });
        if (wallet) {
          await tx.transaction.create({
            data: {
              title: `Withdrawal refund: ${w.method}`,
              amount: w.amount,
              type: TransactionType.INCOME,
              date: new Date(),
              userId: w.userId,
              walletId: wallet.id,
            },
          });
          await tx.wallet.update({
            where: { id: wallet.id },
            data: { balance: { increment: w.amount } },
          });
        }
      });
      const notif = {
        type: NotificationType.WITHDRAWAL,
        title: 'Withdrawal Rejected',
        body: `Your withdrawal of ${Number(w.amount).toLocaleString()} coins was rejected and refunded to your wallet.`,
      };
      await this.prisma.notification
        .create({ data: { userId: w.userId, ...notif } })
        .catch(() => {});
      this.notifGateway.pushToUser(w.userId, notif);
      void this.telegramService.trySendMessageToUser(
        w.userId,
        `Withdrawal rejected. ${Number(w.amount).toLocaleString()} coins were returned to your wallet.`,
      );
      return { success: true };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to reject withdrawal');
    }
  }

  async getAgentRequests() {
    const [deposits, withdrawals] = await Promise.all([
      this.prisma.deposit.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              role: true,
            },
          },
        },
      }),
      this.prisma.withdrawal.findMany({
        orderBy: { createdAt: 'desc' },
        take: 50,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              role: true,
            },
          },
        },
      }),
    ]);
    return normalizeAvatarUrls(
      { deposits, withdrawals },
      this.configService.get<string>(
        'publicApiUrl',
        `http://localhost:${this.configService.get<number>('port', 3000)}`,
      ),
    );
  }
}
