import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, TransactionType } from 'generated/prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';

const transactionSelect = {
  id: true,
  title: true,
  amount: true,
  type: true,
  status: true,
  note: true,
  date: true,
  isRecurring: true,
  recurrenceInterval: true,
  recurrenceEndsAt: true,
  createdAt: true,
  updatedAt: true,
  wallet: { select: { id: true, name: true, currency: true } },
  category: { select: { id: true, name: true, icon: true, color: true } },
  sourceWallet: { select: { id: true, name: true, currency: true } },
  destinationWallet: { select: { id: true, name: true, currency: true } },
  parentTransactionId: true,
} as const;

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTransactionDto, userId: string) {
    try {
      await this.assertWalletOwnership(dto.walletId, userId);

      if (dto.type === TransactionType.TRANSFER) {
        if (!dto.sourceWalletId || !dto.destinationWalletId) {
          throw new BadRequestException(
            'TRANSFER requires sourceWalletId and destinationWalletId',
          );
        }
        if (dto.sourceWalletId === dto.destinationWalletId) {
          throw new BadRequestException(
            'Source and destination wallets must be different',
          );
        }
        await this.assertWalletOwnership(dto.sourceWalletId, userId);
        await this.assertWalletOwnership(dto.destinationWalletId, userId);
      }

      return await this.prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.create({
          data: {
            title: dto.title,
            amount: dto.amount,
            type: dto.type,
            status: dto.status,
            note: dto.note,
            date: new Date(dto.date),
            userId,
            walletId: dto.walletId,
            categoryId: dto.categoryId,
            sourceWalletId: dto.sourceWalletId,
            destinationWalletId: dto.destinationWalletId,
            isRecurring: dto.isRecurring ?? false,
            recurrenceInterval: dto.recurrenceInterval,
            recurrenceEndsAt: dto.recurrenceEndsAt
              ? new Date(dto.recurrenceEndsAt)
              : undefined,
          },
          select: transactionSelect,
        });

        await this.applyBalanceEffect(tx, dto);

        return transaction;
      });
    } catch (error) {
      if (
        error instanceof BadRequestException ||
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      )
        throw error;
      throw new InternalServerErrorException('Failed to create transaction');
    }
  }

  async findAll(userId: string, query: QueryTransactionDto) {
    try {
      const {
        page = 1,
        limit = 20,
        type,
        status,
        categoryId,
        walletId,
        dateFrom,
        dateTo,
        search,
        sortBy = 'date',
        sortOrder = 'desc',
      } = query;

      const where: Prisma.TransactionWhereInput = {
        deletedAt: null,
        wallet: { userId },
        ...(type && { type }),
        ...(status && { status }),
        ...(categoryId && { categoryId }),
        ...(walletId && { walletId }),
        ...(search && {
          title: { contains: search, mode: 'insensitive' },
        }),
        ...((dateFrom ?? dateTo) && {
          date: {
            ...(dateFrom && { gte: new Date(dateFrom) }),
            ...(dateTo && { lte: new Date(dateTo) }),
          },
        }),
      };

      const [data, total] = await this.prisma.$transaction([
        this.prisma.transaction.findMany({
          where,
          select: transactionSelect,
          orderBy: { [sortBy]: sortOrder },
          skip: (page - 1) * limit,
          take: limit,
        }),
        this.prisma.transaction.count({ where }),
      ]);

      return {
        data,
        meta: {
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit),
          hasNextPage: page * limit < total,
          hasPrevPage: page > 1,
        },
      };
    } catch {
      throw new InternalServerErrorException('Failed to fetch transactions');
    }
  }

  async findOne(id: string, userId: string) {
    try {
      const transaction = await this.prisma.transaction.findFirst({
        where: { id, deletedAt: null, wallet: { userId } },
        select: {
          ...transactionSelect,
          recurringChildren: { select: transactionSelect },
        },
      });

      if (!transaction) throw new NotFoundException('Transaction not found');
      return transaction;
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to fetch transaction');
    }
  }

  async update(id: string, dto: UpdateTransactionDto, userId: string) {
    try {
      const existing = await this.findOne(id, userId);

      if (existing.type === TransactionType.TRANSFER) {
        throw new BadRequestException('Transfer transactions cannot be edited');
      }

      return await this.prisma.$transaction(async (tx) => {
        // reverse old balance effect
        await this.reverseBalanceEffect(tx, existing);

        const updated = await tx.transaction.update({
          where: { id },
          data: {
            ...dto,
            date: dto.date ? new Date(dto.date) : undefined,
          },
          select: transactionSelect,
        });

        // apply new balance effect
        await this.applyBalanceEffect(tx, {
          type: updated.type,
          amount: Number(updated.amount),
          walletId: updated.wallet.id,
        });

        return updated;
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      )
        throw error;
      throw new InternalServerErrorException('Failed to update transaction');
    }
  }

  async remove(id: string, userId: string) {
    try {
      const existing = await this.findOne(id, userId);

      return await this.prisma.$transaction(async (tx) => {
        await this.reverseBalanceEffect(tx, existing);

        return tx.transaction.update({
          where: { id },
          data: { deletedAt: new Date() },
          select: { id: true, deletedAt: true },
        });
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new InternalServerErrorException('Failed to delete transaction');
    }
  }

  async getSummary(userId: string, walletId?: string, month?: string) {
    try {
      const now = new Date();
      const start = month
        ? new Date(`${month}-01`)
        : new Date(now.getFullYear(), now.getMonth(), 1);
      const end = month
        ? new Date(new Date(start).setMonth(start.getMonth() + 1))
        : new Date(now.getFullYear(), now.getMonth() + 1, 1);

      const where: Prisma.TransactionWhereInput = {
        deletedAt: null,
        wallet: { userId },
        date: { gte: start, lt: end },
        ...(walletId && { walletId }),
      };

      const [income, expense, transfer, count] = await this.prisma.$transaction(
        [
          this.prisma.transaction.aggregate({
            where: { ...where, type: TransactionType.INCOME },
            _sum: { amount: true },
          }),
          this.prisma.transaction.aggregate({
            where: { ...where, type: TransactionType.EXPENSE },
            _sum: { amount: true },
          }),
          this.prisma.transaction.aggregate({
            where: { ...where, type: TransactionType.TRANSFER },
            _sum: { amount: true },
          }),
          this.prisma.transaction.count({ where }),
        ],
      );

      const totalIncome = Number(income._sum.amount ?? 0);
      const totalExpense = Number(expense._sum.amount ?? 0);

      return {
        period: { start, end },
        totalIncome,
        totalExpense,
        totalTransfer: Number(transfer._sum.amount ?? 0),
        netBalance: totalIncome - totalExpense,
        transactionCount: count,
      };
    } catch {
      throw new InternalServerErrorException('Failed to fetch summary');
    }
  }

  // ── private helpers ──────────────────────────────────────────────

  private async assertWalletOwnership(walletId: string, userId: string) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { id: walletId, userId, deletedAt: null, isActive: true },
    });
    if (!wallet) throw new NotFoundException(`Wallet ${walletId} not found`);
    return wallet;
  }

  private async applyBalanceEffect(
    tx: Prisma.TransactionClient,
    dto: {
      type: TransactionType;
      amount: number;
      walletId: string;
      sourceWalletId?: string;
      destinationWalletId?: string;
    },
  ) {
    if (dto.type === TransactionType.INCOME) {
      await this.applyWalletBalanceDelta(tx, dto.walletId, dto.amount);
    } else if (dto.type === TransactionType.EXPENSE) {
      await this.applyWalletBalanceDelta(tx, dto.walletId, -dto.amount);
    } else if (
      dto.type === TransactionType.TRANSFER &&
      dto.sourceWalletId &&
      dto.destinationWalletId
    ) {
      await this.applyWalletBalanceDelta(tx, dto.sourceWalletId, -dto.amount);
      await this.applyWalletBalanceDelta(tx, dto.destinationWalletId, dto.amount);
    }
  }

  private async reverseBalanceEffect(
    tx: Prisma.TransactionClient,
    existing: {
      type: TransactionType;
      amount: Prisma.Decimal;
      wallet: { id: string };
      sourceWallet: { id: string } | null;
      destinationWallet: { id: string } | null;
    },
  ) {
    const amount = Number(existing.amount);

    if (existing.type === TransactionType.INCOME) {
      await this.applyWalletBalanceDelta(tx, existing.wallet.id, -amount);
    } else if (existing.type === TransactionType.EXPENSE) {
      await this.applyWalletBalanceDelta(tx, existing.wallet.id, amount);
    } else if (existing.type === TransactionType.TRANSFER) {
      if (existing.sourceWallet) {
        await this.applyWalletBalanceDelta(tx, existing.sourceWallet.id, amount);
      }
      if (existing.destinationWallet) {
        await this.applyWalletBalanceDelta(
          tx,
          existing.destinationWallet.id,
          -amount,
        );
      }
    }
  }

  private async applyWalletBalanceDelta(
    tx: Prisma.TransactionClient,
    walletId: string,
    delta: number,
  ) {
    if (delta === 0) return;

    const wallet = await tx.wallet.findUnique({
      where: { id: walletId },
      select: { id: true, userId: true, isDefault: true },
    });

    if (!wallet) {
      throw new NotFoundException(`Wallet ${walletId} not found`);
    }

    const amount = Math.abs(delta);
    const amountDecimal = new Prisma.Decimal(amount);
    const deltaDecimal = new Prisma.Decimal(delta);

    if (delta < 0) {
      const updatedWallets = await tx.wallet.updateMany({
        where: {
          id: walletId,
          balance: { gte: amountDecimal },
        },
        data: { balance: { increment: deltaDecimal } },
      });

      if (updatedWallets.count !== 1) {
        throw new BadRequestException('Insufficient wallet balance');
      }
    } else {
      await tx.wallet.update({
        where: { id: walletId },
        data: { balance: { increment: deltaDecimal } },
      });
    }

    if (wallet.isDefault) {
      await this.applyUserCoinDelta(tx, wallet.userId, delta);
    }
  }

  private async applyUserCoinDelta(
    tx: Prisma.TransactionClient,
    userId: string,
    delta: number,
  ) {
    if (delta === 0) return;

    if (delta < 0) {
      const updatedUsers = await tx.user.updateMany({
        where: {
          id: userId,
          coinsBalance: { gte: Math.abs(delta) },
        },
        data: { coinsBalance: { increment: delta } },
      });

      if (updatedUsers.count !== 1) {
        throw new BadRequestException('Insufficient coin balance');
      }

      return;
    }

    await tx.user.update({
      where: { id: userId },
      data: { coinsBalance: { increment: delta } },
    });
  }
}
