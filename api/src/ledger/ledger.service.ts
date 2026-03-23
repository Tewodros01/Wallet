import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  Prisma,
  TransactionStatus,
  TransactionType,
} from 'generated/prisma/client';

type LedgerEntryInput = {
  userId: string;
  title: string;
  amount: number;
  balanceDelta: number;
  type: TransactionType;
  note?: string;
  date?: Date;
  status?: TransactionStatus;
  walletId?: string;
  sourceWalletId?: string;
  destinationWalletId?: string;
  gameRoomId?: string;
};

@Injectable()
export class LedgerService {
  async getBalance(
    tx: Prisma.TransactionClient,
    userId: string,
  ): Promise<number> {
    const user = await tx.user.findUnique({
      where: { id: userId },
      select: { coinsBalance: true },
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user.coinsBalance;
  }

  async applyEntry(
    tx: Prisma.TransactionClient,
    input: LedgerEntryInput,
  ): Promise<number> {
    if (input.amount <= 0) {
      throw new BadRequestException('Ledger amount must be positive');
    }

    const wallet =
      input.walletId
        ? await tx.wallet.findFirst({
            where: {
              id: input.walletId,
              userId: input.userId,
              deletedAt: null,
              isActive: true,
            },
            select: { id: true },
          })
        : await tx.wallet.findFirst({
            where: {
              userId: input.userId,
              isDefault: true,
              isActive: true,
              deletedAt: null,
            },
            select: { id: true },
          });

    if (!wallet) {
      throw new NotFoundException(
        input.walletId
          ? 'Wallet not found'
          : 'Default wallet not found for user',
      );
    }

    if (input.balanceDelta !== 0) {
      const walletDelta = new Prisma.Decimal(input.balanceDelta);

      if (input.balanceDelta < 0) {
        const debitAmount = Math.abs(input.balanceDelta);
        const updatedUsers = await tx.user.updateMany({
          where: {
            id: input.userId,
            coinsBalance: { gte: debitAmount },
          },
          data: { coinsBalance: { increment: input.balanceDelta } },
        });
        const updatedWallets = await tx.wallet.updateMany({
          where: {
            id: wallet.id,
            balance: { gte: new Prisma.Decimal(debitAmount) },
          },
          data: { balance: { increment: walletDelta } },
        });

        if (updatedUsers.count !== 1 || updatedWallets.count !== 1) {
          throw new BadRequestException('Insufficient coin balance');
        }
      } else {
        await tx.user.update({
          where: { id: input.userId },
          data: { coinsBalance: { increment: input.balanceDelta } },
        });
        await tx.wallet.update({
          where: { id: wallet.id },
          data: { balance: { increment: walletDelta } },
        });
      }
    }

    await tx.transaction.create({
      data: {
        title: input.title,
        amount: input.amount,
        type: input.type,
        status: input.status,
        note: input.note,
        date: input.date ?? new Date(),
        userId: input.userId,
        walletId: wallet.id,
        sourceWalletId: input.sourceWalletId,
        destinationWalletId: input.destinationWalletId,
        gameRoomId: input.gameRoomId,
      },
    });
    return this.getBalance(tx, input.userId);
  }
}
