import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { WalletService } from 'src/wallet/wallet.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';

@Injectable()
export class TransactionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly walletService: WalletService,
  ) {}

  async create(dto: CreateTransactionDto, userId: string) {
    const wallet = await this.walletService.findOne(dto.walletId, userId);

    if (dto.type === 'TRANSFER') {
      if (!dto.destinationWalletId) {
        throw new BadRequestException(
          'Destination wallet is required for transfers',
        );
      }

      if (dto.walletId === dto.destinationWalletId) {
        throw new BadRequestException(
          'Source and  destination wallet must be different',
        );
      }

      const destWallet = await this.walletService.findOne(
        dto.destinationWalletId,
        userId,
      );

      if (Number(wallet.balance) < Number(dto.amount)) {
        throw new BadRequestException('Insufficient balance');
      }

      return this.prisma.$transaction(async (tx) => {
        const transaction = await tx.transaction.create({
          data: {
            title: dto.title,
            amount: dto.amount,
            type: 'TRANSFER',
            status: dto.status ?? 'COMPLETED',
            date: dto.date,
            categoryId: dto.categoryId,
            note: dto.note,
            isRecurring: dto.isRecurring ?? false,
            recurrenceInterval: dto.recurrenceInterval,
            recurringEndsAt: dto.recurringEndsAt
              ? new Date(dto.recurringEndsAt)
              : undefined,
            walletId: dto.walletId,
            destinationWalletId: dto.destinationWalletId,
          },
          include: {
            wallet: true,
            sourceWallet: true,
            destinationWallet: true,
          },
        });

        await tx.wallet.update({
          where: { id: dto.walletId },
          data: { balance: { decrement: dto.amount } },
        });
        await tx.wallet.update({
          where: { id: dto.destinationWalletId },
          data: { balance: { increment: dto.amount } },
        });

        return transaction;
      });
    }

    return this.prisma.$transaction(async (tx) => {
      const transaction = await tx.transaction.create({
        data: {
          title: dto.title,
          amount: dto.amount,
          type: dto.type,
          status: dto.status ?? 'COMPLETED',
          date: dto.date,
          categoryId: dto.categoryId,
          note: dto.note,
          isRecurring: dto.isRecurring ?? false,
          recurrenceInterval: dto.recurrenceInterval,
          recurringEndsAt: dto.recurringEndsAt
            ? new Date(dto.recurringEndsAt)
            : undefined,
          walletId: dto.walletId,
        },
        include: {
          wallet: true,
          sourceWallet: true,
          destinationWallet: true,
        },
      });

      if (dto.type === 'INCOME') {
        await tx.wallet.update({
          where: { id: dto.walletId },
          data: { balance: { increment: dto.amount } },
        });
      } else {
        if (Number(wallet.balance) < Number(dto.amount)) {
          throw new BadRequestException('Insufficient Balance');
        }
        await tx.wallet.update({
          where: { id: dto.walletId },
          data: { balance: { decrement: dto.amount } },
        });
      }
      return transaction;
    });
  }
}
