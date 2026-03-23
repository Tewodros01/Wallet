import { BadRequestException, NotFoundException } from '@nestjs/common';
import { TransactionType } from 'generated/prisma/client';
import { LedgerService } from './ledger.service';

describe('LedgerService', () => {
  let service: LedgerService;

  beforeEach(() => {
    service = new LedgerService();
  });

  it('applies a credit and creates a transaction when a default wallet exists', async () => {
    const tx = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ coinsBalance: 100 }),
        update: jest.fn().mockResolvedValue(undefined),
      },
      wallet: {
        findFirst: jest.fn().mockResolvedValue({ id: 'wallet-1' }),
        update: jest.fn().mockResolvedValue(undefined),
      },
      transaction: {
        create: jest.fn().mockResolvedValue(undefined),
      },
    } as any;

    const nextBalance = await service.applyEntry(tx, {
      userId: 'user-1',
      title: 'Daily Bonus Spin',
      amount: 50,
      balanceDelta: 50,
      type: TransactionType.INCOME,
    });

    expect(nextBalance).toBe(150);
    expect(tx.user.update).toHaveBeenCalled();
    expect(tx.transaction.create).toHaveBeenCalled();
    expect(tx.wallet.update).toHaveBeenCalledWith({
      where: { id: 'wallet-1' },
      data: { balance: { increment: 50 } },
    });
  });

  it('rejects a debit that would make the balance negative', async () => {
    const tx = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ coinsBalance: 25 }),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
      wallet: {
        findFirst: jest.fn().mockResolvedValue({ id: 'wallet-1' }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    } as any;

    await expect(
      service.applyEntry(tx, {
        userId: 'user-1',
        title: 'Withdrawal',
        amount: 50,
        balanceDelta: -50,
        type: TransactionType.WITHDRAWAL,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a debit when the wallet balance is lower than the coin balance', async () => {
    const tx = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ coinsBalance: 100 }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      wallet: {
        findFirst: jest.fn().mockResolvedValue({ id: 'wallet-1' }),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    } as any;

    await expect(
      service.applyEntry(tx, {
        userId: 'user-1',
        title: 'Room Entry',
        amount: 50,
        balanceDelta: -50,
        type: TransactionType.GAME_ENTRY,
      }),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('allows zero balance delta while still recording the transaction', async () => {
    const tx = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ coinsBalance: 100 }),
        update: jest.fn(),
      },
      wallet: {
        findFirst: jest.fn().mockResolvedValue({ id: 'wallet-1' }),
        update: jest.fn(),
      },
      transaction: {
        create: jest.fn().mockResolvedValue(undefined),
      },
    } as any;

    const nextBalance = await service.applyEntry(tx, {
      userId: 'user-1',
      title: 'Break-even Keno',
      amount: 25,
      balanceDelta: 0,
      type: TransactionType.GAME_ENTRY,
    });

    expect(nextBalance).toBe(100);
    expect(tx.user.update).not.toHaveBeenCalled();
    expect(tx.wallet.update).not.toHaveBeenCalled();
    expect(tx.transaction.create).toHaveBeenCalled();
  });

  it('throws when the user is missing', async () => {
    const tx = {
      user: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    } as any;

    await expect(service.getBalance(tx, 'missing')).rejects.toBeInstanceOf(
      NotFoundException,
    );
  });
});
