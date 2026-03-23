import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomInt } from 'crypto';
import {
  DepositStatus,
  FinancialAccountProvider,
  MissionCategory,
  NotificationType,
  PaymentMethod,
  Prisma,
  Role,
  TransactionType,
  WithdrawalStatus,
} from 'generated/prisma/client';
import { AgentsService } from '../agents/agents.service';
import { ActiveUser } from '../auth/decorators/get-user.decorators';
import {
  normalizeAvatarUrls,
  normalizePublicAssetFields,
} from '../common/utils/avatar-url.util';
import { LedgerService } from '../ledger/ledger.service';
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
const BANK_WITHDRAWAL_FEE_BPS = 150;
const ZERO_FEE_METHODS: ReadonlySet<PaymentMethod> = new Set([
  'TELEBIRR',
  'MPESA',
  'CBE_BIRR',
]);

const KENO_PAYOUTS: Record<number, Record<number, number>> = {
  1: { 1: 3 },
  2: { 2: 12 },
  3: { 2: 2, 3: 40 },
  4: { 2: 1, 3: 5, 4: 100 },
  5: { 3: 3, 4: 20, 5: 500 },
  6: { 3: 2, 4: 8, 5: 75, 6: 1000 },
  7: { 3: 1, 4: 5, 5: 20, 6: 120, 7: 1500 },
  8: { 4: 3, 5: 12, 6: 50, 7: 300, 8: 3500 },
  9: { 4: 2, 5: 8, 6: 35, 7: 150, 8: 1200, 9: 8000 },
  10: { 5: 5, 6: 20, 7: 100, 8: 1000, 9: 10000, 10: 100000 },
};

const financialAccountSelect = {
  id: true,
  type: true,
  provider: true,
  accountName: true,
  accountNumber: true,
  label: true,
  isDefault: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

const financialAccountOrderBy: Prisma.FinancialAccountOrderByWithRelationInput[] =
  [{ isDefault: 'desc' }, { createdAt: 'asc' }];

@Injectable()
export class PaymentsService {
  private static readonly SERIALIZABLE_RETRIES = 3;

  constructor(
    private readonly prisma: PrismaService,
    private readonly ledgerService: LedgerService,
    private readonly agentsService: AgentsService,
    private readonly missionsService: MissionsService,
    private readonly notifGateway: NotificationsGateway,
    private readonly configService: ConfigService,
    private readonly telegramService: TelegramService,
  ) {}

  private get publicApiUrl() {
    return this.configService.get<string>(
      'publicApiUrl',
      `http://localhost:${this.configService.get<number>('port', 3000)}`,
    );
  }

  private normalizePaymentAssets<T>(value: T): T {
    return normalizePublicAssetFields(value, this.publicApiUrl, ['proofUrl']);
  }

  private async assertAgentSupportsMethod(
    agentId: string,
    method: CreateDepositDto['method'],
  ) {
    const agent = await this.prisma.user.findFirst({
      where: { id: agentId, role: Role.AGENT, deletedAt: null },
      select: {
        id: true,
        financialAccounts: {
          where: { isActive: true },
          select: { provider: true, type: true },
        },
      },
    });

    if (!agent) {
      throw new BadRequestException('Selected agent was not found');
    }

    const supportsMethod = agent.financialAccounts.some((account) => {
      switch (method) {
        case 'TELEBIRR':
          return account.provider === FinancialAccountProvider.TELEBIRR;
        case 'MPESA':
          return account.provider === FinancialAccountProvider.MPESA;
        case 'CBE_BIRR':
          return account.provider === FinancialAccountProvider.CBE_BIRR;
        case 'BANK_CARD':
          return (
            account.provider === FinancialAccountProvider.BOA ||
            account.provider === FinancialAccountProvider.OTHER_BANK ||
            account.type === 'BANK_ACCOUNT'
          );
        default:
          return false;
      }
    });

    if (!supportsMethod) {
      throw new BadRequestException(
        'Selected agent does not support that payment method',
      );
    }
  }

  private calculateWithdrawalFee(
    amount: number,
    method: CreateWithdrawalDto['method'],
  ) {
    if (ZERO_FEE_METHODS.has(method)) {
      return 0;
    }

    return Math.ceil((amount * BANK_WITHDRAWAL_FEE_BPS) / 10_000);
  }

  private assertRequestAccess(
    user: ActiveUser,
    assignedAgentId: string | null,
    label: 'deposit' | 'withdrawal',
  ) {
    if (user.role === Role.ADMIN) return;

    if (user.role !== Role.AGENT) {
      throw new BadRequestException('Only agents can process requests');
    }

    if (!assignedAgentId || assignedAgentId !== user.sub) {
      throw new BadRequestException(
        `You cannot process a ${label} assigned to another agent`,
      );
    }
  }

  // ── Deposits ──────────────────────────────────────────────────────────────

  async createDeposit(dto: CreateDepositDto, userId: string) {
    if (dto.amount < MIN_DEPOSIT)
      throw new BadRequestException(`Minimum deposit is ${MIN_DEPOSIT} coins`);
    if (dto.amount > MAX_DEPOSIT)
      throw new BadRequestException(
        `Maximum deposit is ${MAX_DEPOSIT.toLocaleString()} coins`,
      );
    try {
      await this.assertAgentSupportsMethod(dto.agentId, dto.method);
      const deposit = await this.prisma.deposit.create({
        data: {
          userId,
          agentId: dto.agentId,
          amount: dto.amount,
          method: dto.method,
          reference: dto.reference,
          proofUrl: dto.proofUrl,
        },
      });
      return this.normalizePaymentAssets(deposit);
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
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
        financialAccounts: {
          where: { isActive: true },
          orderBy: financialAccountOrderBy,
          select: financialAccountSelect,
        },
      },
    });

    return normalizeAvatarUrls(agents, this.publicApiUrl);
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
        select: { firstName: true },
      });
      if (!sender) throw new BadRequestException('Sender not found');

      const recipient = await tx.user.findFirst({
        where: { username: recipientUsername, deletedAt: null },
        select: { id: true, firstName: true },
      });
      if (!recipient) throw new BadRequestException('Recipient not found');
      if (recipient.id === senderId)
        throw new BadRequestException('Cannot transfer to yourself');

      await this.ledgerService.applyEntry(tx, {
        userId: senderId,
        title: `Transfer to @${recipientUsername}`,
        amount,
        balanceDelta: -amount,
        type: TransactionType.TRANSFER,
      });
      await this.ledgerService.applyEntry(tx, {
        userId: recipient.id,
        title: `Transfer from @${sender.firstName}`,
        amount,
        balanceDelta: amount,
        type: TransactionType.INCOME,
      });
      return { success: true, recipient: recipient.firstName };
    });
  }

  async getDeposits(userId: string) {
    const deposits = await this.prisma.deposit.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
    return this.normalizePaymentAssets(deposits);
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
      await this.assertAgentSupportsMethod(dto.agentId, dto.method);
      const feeAmount = this.calculateWithdrawalFee(dto.amount, dto.method);
      const payoutAmount = Math.max(0, dto.amount - feeAmount);

      const result = await this.runSerializableTransaction(async (tx) => {
        const withdrawal = await tx.withdrawal.create({
          data: {
            userId,
            agentId: dto.agentId,
            amount: dto.amount,
            feeAmount,
            payoutAmount,
            method: dto.method,
            accountNumber: dto.accountNumber,
            status: WithdrawalStatus.PENDING,
          },
        });

        await this.ledgerService.applyEntry(tx, {
          userId,
          title: `Withdrawal to ${dto.method}`,
          amount: dto.amount,
          balanceDelta: -dto.amount,
          type: TransactionType.WITHDRAWAL,
        });
        await tx.withdrawal.update({
          where: { id: withdrawal.id },
          data: {
            status: WithdrawalStatus.PROCESSING,
            processedAt: new Date(),
          },
        });

        return { ...withdrawal, status: WithdrawalStatus.PROCESSING };
      });

      void this.telegramService.trySendMessageToUser(
        userId,
        `Your withdrawal request for ${dto.amount.toLocaleString()} coins is now processing. Estimated payout: ${payoutAmount.toLocaleString()} coins.`,
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
      const result = await this.runSerializableTransaction(async (tx) => {
        const coins =
          DAILY_BONUS_PRIZES[randomInt(0, DAILY_BONUS_PRIZES.length)];

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

        const newBalance = await this.ledgerService.applyEntry(tx, {
          userId,
          title: 'Daily Bonus Spin',
          amount: coins,
          balanceDelta: coins,
          type: TransactionType.INCOME,
        });
        return { coins, newBalance };
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
      const j = randomInt(0, i + 1);
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    const drawn = pool.slice(0, 20);

    try {
      const result = await this.prisma.$transaction(async (tx) => {
        const drawnSet = new Set(drawn);
        const matches = picks.filter((n) => drawnSet.has(n)).length;
        const multiplier = KENO_PAYOUTS[picks.length]?.[matches] ?? 0;
        const payout = multiplier * bet;
        const net = payout - bet;

        const newBalance = await this.ledgerService.applyEntry(tx, {
          userId,
          title: `Keno — ${matches} match${matches !== 1 ? 'es' : ''} (${picks.length} picks)`,
          amount: Math.abs(net),
          balanceDelta: net,
          type:
            net >= 0 ? TransactionType.GAME_WIN : TransactionType.GAME_ENTRY,
        });

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

        return {
          matches,
          payout,
          bet,
          net,
          drawn,
          newBalance,
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

  async agentApproveDeposit(depositId: string, actor: ActiveUser) {
    try {
      const deposit = await this.prisma.$transaction(async (tx) => {
        const pendingDeposit = await tx.deposit.findUnique({
          where: { id: depositId },
        });
        if (!pendingDeposit) throw new BadRequestException('Deposit not found');
        this.assertRequestAccess(actor, pendingDeposit.agentId, 'deposit');

        const updated = await tx.deposit.updateMany({
          where: { id: depositId, status: DepositStatus.PENDING },
          data: { status: DepositStatus.COMPLETED, completedAt: new Date() },
        });
        if (updated.count !== 1) {
          throw new BadRequestException('Already processed');
        }

        await this.ledgerService.applyEntry(tx, {
          userId: pendingDeposit.userId,
          title: `Deposit via ${pendingDeposit.method}`,
          amount: pendingDeposit.amount,
          balanceDelta: pendingDeposit.amount,
          type: TransactionType.DEPOSIT,
        });

        return pendingDeposit;
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

  async agentRejectDeposit(depositId: string, actor: ActiveUser) {
    try {
      const deposit = await this.prisma.$transaction(async (tx) => {
        const pendingDeposit = await tx.deposit.findUnique({
          where: { id: depositId },
        });
        if (!pendingDeposit) throw new BadRequestException('Deposit not found');
        this.assertRequestAccess(actor, pendingDeposit.agentId, 'deposit');

        const updated = await tx.deposit.updateMany({
          where: { id: depositId, status: DepositStatus.PENDING },
          data: { status: DepositStatus.FAILED },
        });
        if (updated.count !== 1) {
          throw new BadRequestException('Already processed');
        }

        return pendingDeposit;
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

  async agentApproveWithdrawal(withdrawalId: string, actor: ActiveUser) {
    try {
      const w = await this.prisma.$transaction(async (tx) => {
        const pendingWithdrawal = await tx.withdrawal.findUnique({
          where: { id: withdrawalId },
        });
        if (!pendingWithdrawal) {
          throw new BadRequestException('Withdrawal not found');
        }
        this.assertRequestAccess(
          actor,
          pendingWithdrawal.agentId,
          'withdrawal',
        );

        const updated = await tx.withdrawal.updateMany({
          where: {
            id: withdrawalId,
            status: {
              in: [WithdrawalStatus.PROCESSING, WithdrawalStatus.PENDING],
            },
          },
          data: {
            status: WithdrawalStatus.COMPLETED,
            completedAt: new Date(),
          },
        });
        if (updated.count !== 1) {
          throw new BadRequestException('Already processed');
        }

        return pendingWithdrawal;
      });
      const notif = {
        type: NotificationType.WITHDRAWAL,
        title: 'Withdrawal Approved ✅',
        body: `Your withdrawal of ${Number(w.amount).toLocaleString()} coins has been approved. ${Number(w.payoutAmount ?? w.amount).toLocaleString()} coins will be sent to your account shortly.`,
      };
      await this.prisma.notification
        .create({ data: { userId: w.userId, ...notif } })
        .catch(() => {});
      this.notifGateway.pushToUser(w.userId, notif);
      void this.telegramService.trySendMessageToUser(
        w.userId,
        `Withdrawal approved. ${Number(w.payoutAmount ?? w.amount).toLocaleString()} coins will be sent to your ${w.method} account shortly.`,
      );
      return { success: true };
    } catch (error) {
      if (error instanceof BadRequestException) throw error;
      throw new InternalServerErrorException('Failed to approve withdrawal');
    }
  }

  async agentRejectWithdrawal(withdrawalId: string, actor: ActiveUser) {
    try {
      const w = await this.prisma.$transaction(async (tx) => {
        const pendingWithdrawal = await tx.withdrawal.findUnique({
          where: { id: withdrawalId },
        });
        if (!pendingWithdrawal) {
          throw new BadRequestException('Withdrawal not found');
        }
        this.assertRequestAccess(
          actor,
          pendingWithdrawal.agentId,
          'withdrawal',
        );

        const updated = await tx.withdrawal.updateMany({
          where: {
            id: withdrawalId,
            status: {
              in: [WithdrawalStatus.PROCESSING, WithdrawalStatus.PENDING],
            },
          },
          data: { status: WithdrawalStatus.REJECTED },
        });
        if (updated.count !== 1) {
          throw new BadRequestException('Already processed');
        }

        await this.ledgerService.applyEntry(tx, {
          userId: pendingWithdrawal.userId,
          title: `Withdrawal refund: ${pendingWithdrawal.method}`,
          amount: pendingWithdrawal.amount,
          balanceDelta: pendingWithdrawal.amount,
          type: TransactionType.INCOME,
        });

        return pendingWithdrawal;
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

  async getAgentRequests(actor: ActiveUser) {
    const where = actor.role === Role.ADMIN ? {} : { agentId: actor.sub };

    const [deposits, withdrawals] = await Promise.all([
      this.prisma.deposit.findMany({
        where,
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
          agent: {
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
        where,
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
          agent: {
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
    return this.normalizePaymentAssets(
      normalizeAvatarUrls({ deposits, withdrawals }, this.publicApiUrl),
    );
  }

  async getAdminDeposits() {
    const deposits = await this.prisma.deposit.findMany({
      orderBy: { createdAt: 'desc' },
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
        agent: {
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
    });

    return this.normalizePaymentAssets(
      normalizeAvatarUrls(deposits, this.publicApiUrl),
    );
  }

  async getAdminWithdrawals() {
    const withdrawals = await this.prisma.withdrawal.findMany({
      orderBy: { createdAt: 'desc' },
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
        agent: {
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
    });

    return normalizeAvatarUrls(withdrawals, this.publicApiUrl);
  }

  private async runSerializableTransaction<T>(
    operation: (tx: Prisma.TransactionClient) => Promise<T>,
  ): Promise<T> {
    for (
      let attempt = 1;
      attempt <= PaymentsService.SERIALIZABLE_RETRIES;
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
          attempt < PaymentsService.SERIALIZABLE_RETRIES
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
