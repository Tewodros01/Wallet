import {
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  NotificationType,
  DepositStatus,
  Role,
  TransactionType,
  WithdrawalStatus,
} from 'generated/prisma/client';
import { PaymentsService } from './payments.service';

const AGENT_USER = { sub: 'agent-1', email: 'agent@example.com', role: Role.AGENT };

describe('PaymentsService', () => {
  const createService = () => {
    const prisma = {
      $transaction: jest.fn(),
      user: {
        findFirst: jest.fn().mockResolvedValue({
          id: 'agent-1',
          financialAccounts: [{ provider: 'TELEBIRR', type: 'MOBILE_WALLET' }],
        }),
      },
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
        agentId: 'agent-1',
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
    const tx = {
      withdrawal: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'wd-1',
          userId: 'user-9',
          agentId: 'agent-1',
          amount: 250,
          payoutAmount: 250,
          method: 'CBE_BIRR',
          status: WithdrawalStatus.PROCESSING,
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
    };
    prisma.$transaction.mockImplementation(
      async (callback: (db: unknown) => unknown) => callback(tx),
    );

    const result = await service.agentRejectWithdrawal('wd-1', AGENT_USER);

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

  it('does not double-credit a deposit when it has already been processed', async () => {
    const { service, prisma, ledgerService } = createService();
    const tx = {
      deposit: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'dep-1',
          userId: 'user-4',
          agentId: 'agent-1',
          amount: 300,
          method: 'TELEBIRR',
          status: DepositStatus.PENDING,
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    prisma.$transaction.mockImplementation(
      async (callback: (db: unknown) => unknown) => callback(tx),
    );

    await expect(
      service.agentApproveDeposit('dep-1', AGENT_USER),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(ledgerService.applyEntry).not.toHaveBeenCalled();
  });

  it('does not refund a withdrawal twice when it has already been processed', async () => {
    const { service, prisma, ledgerService } = createService();
    const tx = {
      withdrawal: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'wd-2',
          userId: 'user-8',
          agentId: 'agent-1',
          amount: 250,
          method: 'CBE_BIRR',
          status: WithdrawalStatus.PROCESSING,
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 0 }),
      },
    };
    prisma.$transaction.mockImplementation(
      async (callback: (db: unknown) => unknown) => callback(tx),
    );

    await expect(
      service.agentRejectWithdrawal('wd-2', AGENT_USER),
    ).rejects.toBeInstanceOf(BadRequestException);
    expect(ledgerService.applyEntry).not.toHaveBeenCalled();
  });

  it('claims the daily bonus inside the serializable transaction helper', async () => {
    const { service, ledgerService } = createService();
    const tx = {
      transaction: {
        findFirst: jest.fn().mockResolvedValue(null),
      },
    };
    const serializableSpy = jest
      .spyOn(service as any, 'runSerializableTransaction')
      .mockImplementation(async (operation: (db: unknown) => unknown) => operation(tx));
    ledgerService.applyEntry.mockResolvedValue(250);

    const result = await service.claimDailyBonus('user-1');

    expect(serializableSpy).toHaveBeenCalled();
    expect(result).toEqual({
      coins: expect.any(Number),
      newBalance: 250,
    });
    expect(ledgerService.applyEntry).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        userId: 'user-1',
        title: 'Daily Bonus Spin',
      }),
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
          agentId: 'agent-1',
          method: 'TELEBIRR' as any,
          accountNumber: '+251900000000',
        },
        'user-1',
      ),
    ).rejects.toBeInstanceOf(InternalServerErrorException);
  });
});
