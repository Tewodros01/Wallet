import { BadRequestException } from '@nestjs/common';
import { TransactionType } from 'generated/prisma/client';
import { TransactionsService } from './transactions.service';

describe('TransactionsService', () => {
  const createService = () => {
    const prisma = {
      $transaction: jest.fn(),
      wallet: {
        findFirst: jest.fn(),
      },
    };

    const service = new TransactionsService(prisma as any);

    return { service, prisma };
  };

  it('keeps the default wallet and user coin balance in sync for expenses', async () => {
    const { service, prisma } = createService();
    prisma.wallet.findFirst.mockResolvedValue({
      id: 'wallet-1',
      isDefault: true,
    });

    const tx = {
      transaction: {
        create: jest.fn().mockResolvedValue({
          id: 'txn-1',
          amount: 40,
          type: TransactionType.EXPENSE,
          wallet: { id: 'wallet-1', name: 'Main', currency: 'ETB' },
          sourceWallet: null,
          destinationWallet: null,
        }),
      },
      wallet: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'wallet-1',
          userId: 'user-1',
          isDefault: true,
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn(),
      },
      user: {
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        update: jest.fn(),
      },
    };

    prisma.$transaction.mockImplementation(
      async (callback: (db: unknown) => unknown) => callback(tx),
    );

    await service.create(
      {
        title: 'Buy cards',
        amount: 40,
        type: TransactionType.EXPENSE,
        date: '2026-03-23T00:00:00.000Z',
        walletId: 'wallet-1',
      },
      'user-1',
    );

    expect(tx.wallet.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'wallet-1',
        balance: expect.anything(),
      },
      data: { balance: { increment: expect.anything() } },
    });
    expect(tx.user.updateMany).toHaveBeenCalledWith({
      where: {
        id: 'user-1',
        coinsBalance: { gte: 40 },
      },
      data: { coinsBalance: { increment: -40 } },
    });
  });

  it('rejects manual expenses that would overdraw the selected wallet', async () => {
    const { service, prisma } = createService();
    prisma.wallet.findFirst.mockResolvedValue({
      id: 'wallet-2',
      isDefault: false,
    });

    const tx = {
      transaction: {
        create: jest.fn().mockResolvedValue({
          id: 'txn-2',
          amount: 75,
          type: TransactionType.EXPENSE,
          wallet: { id: 'wallet-2', name: 'Side', currency: 'ETB' },
          sourceWallet: null,
          destinationWallet: null,
        }),
      },
      wallet: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'wallet-2',
          userId: 'user-1',
          isDefault: false,
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
        update: jest.fn(),
      },
      user: {
        updateMany: jest.fn(),
        update: jest.fn(),
      },
    };

    prisma.$transaction.mockImplementation(
      async (callback: (db: unknown) => unknown) => callback(tx),
    );

    await expect(
      service.create(
        {
          title: 'Overspend',
          amount: 75,
          type: TransactionType.EXPENSE,
          date: '2026-03-23T00:00:00.000Z',
          walletId: 'wallet-2',
        },
        'user-1',
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    expect(tx.user.updateMany).not.toHaveBeenCalled();
  });
});
