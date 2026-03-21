import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  NotificationType,
  TransactionType,
  WithdrawalStatus,
} from 'generated/prisma/client';
import { PaymentsService } from './payments.service';

describe('PaymentsService', () => {
  const createService = () => {
    const prisma = {
      $transaction: jest.fn(),
      notification: {
        create: jest.fn().mockResolvedValue(undefined),
      },
    };
    const ledgerService = {
      applyEntry: jest.fn(),
    };
    const agentsService = {
      creditDepositCommission: jest.fn(),
    };
    const missionsService = {
      incrementCategoryProgress: jest.fn().mockResolvedValue(undefined),
    };
    const notifGateway = {
      pushToUser: jest.fn(),
    };
    const configService = {
      get: jest.fn((key: string, fallback?: unknown) => fallback),
    };
    const telegramService = {
      trySendMessageToUser: jest.fn(),
    };

    const service = new PaymentsService(
      prisma as any,
      ledgerService as any,
      agentsService as any,
      missionsService as any,
      notifGateway as any,
      configService as any,
      telegramService as any,
    );

    return {
      service,
      prisma,
      ledgerService,
      notifGateway,
      telegramService,
    };
  };

  it('transfers coins through the ledger for sender and recipient', async () => {
    const { service, prisma, ledgerService } = createService();
    const tx = {
      user: {
        findUnique: jest.fn().mockResolvedValue({ firstName: 'Abebe' }),
        findFirst: jest.fn().mockResolvedValue({
          id: 'user-2',
          firstName: 'Kebede',
        }),
      },
    };
    prisma.$transaction.mockImplementation(
      async (callback: (db: unknown) => unknown) => callback(tx),
    );

    const result = await service.transferCoins('user-1', 'kebede', 75);

    expect(result).toEqual({ success: true, recipient: 'Kebede' });
    expect(ledgerService.applyEntry).toHaveBeenNthCalledWith(
      1,
      tx,
      expect.objectContaining({
        userId: 'user-1',
        amount: 75,
        balanceDelta: -75,
        type: TransactionType.TRANSFER,
      }),
    );
    expect(ledgerService.applyEntry).toHaveBeenNthCalledWith(
      2,
      tx,
      expect.objectContaining({
        userId: 'user-2',
        amount: 75,
        balanceDelta: 75,
        type: TransactionType.INCOME,
      }),
    );
  });

  it('creates a processing withdrawal and debits through the ledger', async () => {
    const { service, prisma, ledgerService, telegramService } = createService();
    const tx = {
      withdrawal: {
        create: jest.fn().mockResolvedValue({
          id: 'wd-1',
          userId: 'user-1',
          amount: 100,
          method: 'TELEBIRR',
          accountNumber: '+251900000000',
          status: WithdrawalStatus.PENDING,
        }),
        update: jest.fn().mockResolvedValue(undefined),
      },
    };
    prisma.$transaction.mockImplementation(
      async (callback: (db: unknown) => unknown) => callback(tx),
    );
    ledgerService.applyEntry.mockResolvedValue(400);

    const result = await service.createWithdrawal(
      {
        amount: 100,
        method: 'TELEBIRR' as any,
        accountNumber: '+251900000000',
      },
      'user-1',
    );

    expect(ledgerService.applyEntry).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        userId: 'user-1',
        amount: 100,
        balanceDelta: -100,
        type: TransactionType.WITHDRAWAL,
      }),
    );
    expect(tx.withdrawal.update).toHaveBeenCalledWith({
      where: { id: 'wd-1' },
      data: expect.objectContaining({
        status: WithdrawalStatus.PROCESSING,
      }),
    });
    expect(result).toEqual(
      expect.objectContaining({
        id: 'wd-1',
        status: WithdrawalStatus.PROCESSING,
      }),
    );
    expect(telegramService.trySendMessageToUser).toHaveBeenCalledWith(
      'user-1',
      expect.stringContaining('100 coins'),
    );
  });

  it('refunds rejected withdrawals back through the ledger', async () => {
    const { service, prisma, ledgerService, notifGateway, telegramService } =
      createService();
    prisma.withdrawal = {
      findUnique: jest.fn().mockResolvedValue({
        id: 'wd-1',
        userId: 'user-9',
        amount: 250,
        method: 'CBE_BIRR',
        status: WithdrawalStatus.PROCESSING,
      }),
    } as any;
    const tx = {
      withdrawal: {
        update: jest.fn().mockResolvedValue(undefined),
      },
    };
    prisma.$transaction.mockImplementation(
      async (callback: (db: unknown) => unknown) => callback(tx),
    );

    const result = await service.agentRejectWithdrawal('wd-1');

    expect(result).toEqual({ success: true });
    expect(ledgerService.applyEntry).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        userId: 'user-9',
        amount: 250,
        balanceDelta: 250,
        type: TransactionType.INCOME,
      }),
    );
    expect(prisma.notification.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        userId: 'user-9',
        type: NotificationType.WITHDRAWAL,
      }),
    });
    expect(notifGateway.pushToUser).toHaveBeenCalled();
    expect(telegramService.trySendMessageToUser).toHaveBeenCalledWith(
      'user-9',
      expect.stringContaining('250 coins'),
    );
  });

  it('rejects invalid transfer amounts before touching the database', async () => {
    const { service, prisma } = createService();

    await expect(
      service.transferCoins('user-1', 'kebede', 0),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it('wraps unexpected withdrawal failures in an internal error', async () => {
    const { service, prisma } = createService();
    prisma.$transaction.mockRejectedValue(new Error('db down'));

    await expect(
      service.createWithdrawal(
        {
          amount: 100,
          method: 'TELEBIRR' as any,
          accountNumber: '+251900000000',
        },
        'user-1',
      ),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
