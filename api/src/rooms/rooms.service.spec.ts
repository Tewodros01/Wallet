import { BadRequestException } from '@nestjs/common';
import {
  PlayerStatus,
  RoomStatus,
  TransactionType,
} from 'generated/prisma/client';
import { RoomsService } from './rooms.service';

describe('RoomsService', () => {
  const createService = () => {
    const prisma = {
      $transaction: jest.fn(),
    };
    const missionsService = {
      incrementCategoryProgress: jest.fn().mockResolvedValue(undefined),
    };
    const configService = {
      get: jest.fn((key: string, fallback?: unknown) => fallback),
    };
    const ledgerService = {
      applyEntry: jest.fn(),
    };

    const service = new RoomsService(
      prisma as any,
      missionsService as any,
      configService as any,
      ledgerService as any,
    );

    return { service, prisma, missionsService, ledgerService };
  };

  it('refunds paid waiting-room players when an admin cancels the room', async () => {
    const { service, ledgerService } = createService();
    const tx = {
      roomPlayer: {
        findMany: jest.fn().mockResolvedValue([
          {
            id: 'rp-1',
            userId: 'user-1',
            _count: { cards: 2 },
          },
          {
            id: 'rp-2',
            userId: 'user-2',
            _count: { cards: 1 },
          },
        ]),
        updateMany: jest.fn().mockResolvedValue(undefined),
      },
      gameRoom: {
        update: jest.fn().mockResolvedValue(undefined),
      },
    };

    jest
      .spyOn(service as any, 'runSerializableTransaction')
      .mockImplementation(async (operation: (db: unknown) => unknown) => operation(tx));
    jest.spyOn(service as any, 'getRoomSummaryOrThrowTx').mockResolvedValue({
      id: 'room-1',
      name: 'Friday Room',
      status: RoomStatus.WAITING,
      entryFee: 25,
    });
    jest.spyOn(service as any, 'getRoomByIdOrThrowTx').mockResolvedValue({
      id: 'room-1',
      status: RoomStatus.CANCELLED,
    });

    await service.cancelByAdmin('room-1');

    expect(ledgerService.applyEntry).toHaveBeenNthCalledWith(
      1,
      tx,
      expect.objectContaining({
        userId: 'user-1',
        amount: 50,
        balanceDelta: 50,
        type: TransactionType.INCOME,
        gameRoomId: 'room-1',
      }),
    );
    expect(ledgerService.applyEntry).toHaveBeenNthCalledWith(
      2,
      tx,
      expect.objectContaining({
        userId: 'user-2',
        amount: 25,
        balanceDelta: 25,
        type: TransactionType.INCOME,
        gameRoomId: 'room-1',
      }),
    );
    expect(tx.roomPlayer.updateMany).toHaveBeenCalledWith({
      where: { roomId: 'room-1' },
      data: expect.objectContaining({
        status: PlayerStatus.LEFT,
      }),
    });
  });

  it('credits the winner through the ledger when bingo is claimed', async () => {
    const { service, ledgerService, missionsService } = createService();
    const tx = {
      gameRoom: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'room-2',
          name: 'Jackpot Room',
          status: RoomStatus.PLAYING,
          prizePool: 300,
        }),
        updateMany: jest.fn().mockResolvedValue({ count: 1 }),
      },
      roomPlayer: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'player-1',
          hasBingo: false,
        }),
        findMany: jest.fn().mockResolvedValue([
          { userId: 'winner-1' },
          { userId: 'loser-1' },
        ]),
        update: jest.fn().mockResolvedValue(undefined),
        updateMany: jest.fn().mockResolvedValue(undefined),
      },
    };

    jest
      .spyOn(service as any, 'runSerializableTransaction')
      .mockImplementation(async (operation: (db: unknown) => unknown) => operation(tx));
    jest.spyOn(service as any, 'getClaimableCardTx').mockResolvedValue(undefined);

    const result = await service.claimBingo('room-2', 'winner-1');

    expect(result).toEqual({ winner: 'winner-1', prize: 300 });
    expect(ledgerService.applyEntry).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        userId: 'winner-1',
        amount: 300,
        balanceDelta: 300,
        type: TransactionType.GAME_WIN,
        gameRoomId: 'room-2',
      }),
    );
    expect(missionsService.incrementCategoryProgress).toHaveBeenCalledWith(
      'winner-1',
      expect.anything(),
    );
  });

  it('rejects cancelling a room that is not waiting', async () => {
    const { service } = createService();
    const tx = {};

    jest
      .spyOn(service as any, 'runSerializableTransaction')
      .mockImplementation(async (operation: (db: unknown) => unknown) => operation(tx));
    jest.spyOn(service as any, 'getRoomSummaryOrThrowTx').mockResolvedValue({
      id: 'room-9',
      status: RoomStatus.PLAYING,
    });

    await expect(service.cancelByAdmin('room-9')).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('charges entry fees through the ledger when selecting room cards', async () => {
    const { service, ledgerService } = createService();
    const tx = {
      roomPlayer: {
        findUnique: jest.fn().mockResolvedValue({ id: 'player-22' }),
      },
      roomPlayerCard: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue(undefined),
      },
      bingoCard: {
        findMany: jest
          .fn()
          .mockResolvedValue([{ id: 'card-1' }, { id: 'card-2' }]),
        updateMany: jest.fn().mockResolvedValue(undefined),
      },
      gameRoom: {
        update: jest.fn().mockResolvedValue(undefined),
      },
    };

    jest
      .spyOn(service as any, 'runSerializableTransaction')
      .mockImplementation(async (operation: (db: unknown) => unknown) => operation(tx));
    jest.spyOn(service as any, 'getRoomSummaryOrThrowTx').mockResolvedValue({
      id: 'room-select-1',
      name: 'Prime Lobby',
      status: RoomStatus.WAITING,
      entryFee: 25,
      cardsPerPlayer: 3,
    });
    jest.spyOn(service as any, 'getPlayerCardsTx').mockResolvedValue([
      { id: 'card-1' },
      { id: 'card-2' },
    ]);

    const result = await service.selectCards('room-select-1', 'user-55', [
      'card-1',
      'card-2',
    ]);

    expect(result).toEqual({
      cards: [{ id: 'card-1' }, { id: 'card-2' }],
    });
    expect(ledgerService.applyEntry).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        userId: 'user-55',
        amount: 50,
        balanceDelta: -50,
        type: TransactionType.GAME_ENTRY,
        gameRoomId: 'room-select-1',
        title: 'Room Entry x2: Prime Lobby',
      }),
    );
    expect(tx.gameRoom.update).toHaveBeenCalledWith({
      where: { id: 'room-select-1' },
      data: { prizePool: { increment: 50 } },
    });
    expect(tx.roomPlayerCard.create).toHaveBeenCalledTimes(2);
    expect(tx.bingoCard.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ['card-1', 'card-2'] } },
      data: { userId: 'user-55' },
    });
  });

  it('does not charge again when a rejoining player already has all allowed cards', async () => {
    const { service, ledgerService } = createService();
    const tx = {
      roomPlayer: {
        findUnique: jest.fn().mockResolvedValue({ id: 'player-88' }),
      },
      roomPlayerCard: {
        count: jest.fn().mockResolvedValue(2),
      },
    };

    jest
      .spyOn(service as any, 'runSerializableTransaction')
      .mockImplementation(async (operation: (db: unknown) => unknown) => operation(tx));
    jest.spyOn(service as any, 'getRoomSummaryOrThrowTx').mockResolvedValue({
      id: 'room-rejoin-1',
      name: 'Rejoin Room',
      status: RoomStatus.WAITING,
      entryFee: 40,
      cardsPerPlayer: 2,
    });
    jest.spyOn(service as any, 'getPlayerCardsTx').mockResolvedValue([
      { id: 'existing-1' },
      { id: 'existing-2' },
    ]);

    const result = await service.selectCards('room-rejoin-1', 'user-22', [
      'new-card-1',
    ]);

    expect(result).toEqual({
      cards: [{ id: 'existing-1' }, { id: 'existing-2' }],
    });
    expect(ledgerService.applyEntry).not.toHaveBeenCalled();
  });

  it('joins a room and then moves entry fees into the prize pool when cards are selected', async () => {
    const { service, ledgerService } = createService();
    let joined = false;
    const createdCards: string[] = [];
    const tx = {
      gameRoom: {
        findUnique: jest.fn().mockResolvedValue({
          id: 'room-flow-1',
          name: 'Flow Room',
          status: RoomStatus.WAITING,
          entryFee: 30,
          cardsPerPlayer: 2,
          isPrivate: false,
          maxPlayers: 20,
        }),
        update: jest.fn().mockResolvedValue(undefined),
      },
      roomPlayer: {
        findUnique: jest
          .fn()
          .mockImplementation(async () => (joined ? { id: 'player-flow-1' } : null)),
      },
      roomPlayerCard: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockImplementation(async ({ data }) => {
          createdCards.push(data.cardId);
          return undefined;
        }),
      },
      bingoCard: {
        findMany: jest.fn().mockResolvedValue([{ id: 'flow-card-1' }]),
        updateMany: jest.fn().mockResolvedValue(undefined),
      },
    };

    jest
      .spyOn(service as any, 'runSerializableTransaction')
      .mockImplementation(async (operation: (db: unknown) => unknown) => operation(tx));
    jest.spyOn(service as any, 'assertJoinAllowed').mockResolvedValue(undefined);
    jest
      .spyOn(service as any, 'assertEntryAffordableTx')
      .mockResolvedValue(undefined);
    jest.spyOn(service as any, 'createRoomPlayerTx').mockImplementation(async () => {
      joined = true;
      return { id: 'player-flow-1' };
    });
    jest.spyOn(service as any, 'getRoomSummaryOrThrowTx').mockResolvedValue({
      id: 'room-flow-1',
      name: 'Flow Room',
      status: RoomStatus.WAITING,
      entryFee: 30,
      cardsPerPlayer: 2,
    });
    jest.spyOn(service as any, 'getPlayerCardsTx').mockImplementation(async () =>
      createdCards.map((id) => ({ id, roomPlayerCardId: `rpc-${id}` })),
    );

    const joinResult = await service.join('room-flow-1', 'user-flow-1', {});
    const selectResult = await service.selectCards(
      'room-flow-1',
      'user-flow-1',
      ['flow-card-1'],
    );

    expect(joinResult).toEqual({
      success: true,
      cards: [],
      cardsToSelect: 2,
    });
    expect(selectResult).toEqual({
      cards: [{ id: 'flow-card-1', roomPlayerCardId: 'rpc-flow-card-1' }],
    });
    expect(ledgerService.applyEntry).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        userId: 'user-flow-1',
        amount: 30,
        balanceDelta: -30,
        type: TransactionType.GAME_ENTRY,
        gameRoomId: 'room-flow-1',
      }),
    );
    expect(tx.gameRoom.update).toHaveBeenCalledWith({
      where: { id: 'room-flow-1' },
      data: { prizePool: { increment: 30 } },
    });
  });

  it('allows a retry after a failed card selection attempt and only charges on the successful retry', async () => {
    const { service, ledgerService } = createService();
    const tx = {
      roomPlayer: {
        findUnique: jest.fn().mockResolvedValue({ id: 'player-retry-1' }),
      },
      roomPlayerCard: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue(undefined),
      },
      bingoCard: {
        findMany: jest.fn().mockResolvedValueOnce([]).mockResolvedValueOnce([
          { id: 'retry-card-1' },
        ]),
        updateMany: jest.fn().mockResolvedValue(undefined),
      },
      gameRoom: {
        update: jest.fn().mockResolvedValue(undefined),
      },
    };

    jest
      .spyOn(service as any, 'runSerializableTransaction')
      .mockImplementation(async (operation: (db: unknown) => unknown) => operation(tx));
    jest.spyOn(service as any, 'getRoomSummaryOrThrowTx').mockResolvedValue({
      id: 'room-retry-1',
      name: 'Retry Room',
      status: RoomStatus.WAITING,
      entryFee: 20,
      cardsPerPlayer: 1,
    });
    jest.spyOn(service as any, 'getPlayerCardsTx').mockResolvedValue([
      { id: 'retry-card-1', roomPlayerCardId: 'rpc-retry-1' },
    ]);

    await expect(
      service.selectCards('room-retry-1', 'user-retry-1', ['retry-card-1']),
    ).rejects.toBeInstanceOf(BadRequestException);

    const retryResult = await service.selectCards(
      'room-retry-1',
      'user-retry-1',
      ['retry-card-1'],
    );

    expect(retryResult).toEqual({
      cards: [{ id: 'retry-card-1', roomPlayerCardId: 'rpc-retry-1' }],
    });
    expect(ledgerService.applyEntry).toHaveBeenCalledTimes(1);
    expect(ledgerService.applyEntry).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        userId: 'user-retry-1',
        amount: 20,
        balanceDelta: -20,
        type: TransactionType.GAME_ENTRY,
        gameRoomId: 'room-retry-1',
      }),
    );
    expect(tx.gameRoom.update).toHaveBeenCalledTimes(1);
  });

  it('only charges once when a multi-card retry succeeds after an initial unavailable selection', async () => {
    const { service, ledgerService } = createService();
    const tx = {
      roomPlayer: {
        findUnique: jest.fn().mockResolvedValue({ id: 'player-retry-2' }),
      },
      roomPlayerCard: {
        count: jest.fn().mockResolvedValue(0),
        create: jest.fn().mockResolvedValue(undefined),
      },
      bingoCard: {
        findMany: jest
          .fn()
          .mockResolvedValueOnce([{ id: 'retry-card-1' }])
          .mockResolvedValueOnce([{ id: 'retry-card-1' }, { id: 'retry-card-2' }]),
        updateMany: jest.fn().mockResolvedValue(undefined),
      },
      gameRoom: {
        update: jest.fn().mockResolvedValue(undefined),
      },
    };

    jest
      .spyOn(service as any, 'runSerializableTransaction')
      .mockImplementation(async (operation: (db: unknown) => unknown) => operation(tx));
    jest.spyOn(service as any, 'getRoomSummaryOrThrowTx').mockResolvedValue({
      id: 'room-retry-2',
      name: 'Retry Duo Room',
      status: RoomStatus.WAITING,
      entryFee: 15,
      cardsPerPlayer: 2,
    });
    jest.spyOn(service as any, 'getPlayerCardsTx').mockResolvedValue([
      { id: 'retry-card-1', roomPlayerCardId: 'rpc-retry-2-a' },
      { id: 'retry-card-2', roomPlayerCardId: 'rpc-retry-2-b' },
    ]);

    await expect(
      service.selectCards('room-retry-2', 'user-retry-2', [
        'retry-card-1',
        'retry-card-2',
      ]),
    ).rejects.toBeInstanceOf(BadRequestException);

    const retryResult = await service.selectCards(
      'room-retry-2',
      'user-retry-2',
      ['retry-card-1', 'retry-card-2'],
    );

    expect(retryResult).toEqual({
      cards: [
        { id: 'retry-card-1', roomPlayerCardId: 'rpc-retry-2-a' },
        { id: 'retry-card-2', roomPlayerCardId: 'rpc-retry-2-b' },
      ],
    });
    expect(ledgerService.applyEntry).toHaveBeenCalledTimes(1);
    expect(ledgerService.applyEntry).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        userId: 'user-retry-2',
        amount: 30,
        balanceDelta: -30,
        type: TransactionType.GAME_ENTRY,
        gameRoomId: 'room-retry-2',
        title: 'Room Entry x2: Retry Duo Room',
      }),
    );
    expect(tx.gameRoom.update).toHaveBeenCalledTimes(1);
    expect(tx.roomPlayerCard.create).toHaveBeenCalledTimes(2);
  });

  it('charges only for newly selected cards when the player already owns some cards', async () => {
    const { service, ledgerService } = createService();
    const tx = {
      roomPlayer: {
        findUnique: jest.fn().mockResolvedValue({ id: 'player-mixed-1' }),
      },
      roomPlayerCard: {
        count: jest.fn().mockResolvedValue(1),
        create: jest.fn().mockResolvedValue(undefined),
      },
      bingoCard: {
        findMany: jest.fn().mockResolvedValue([{ id: 'new-card-2' }]),
        updateMany: jest.fn().mockResolvedValue(undefined),
      },
      gameRoom: {
        update: jest.fn().mockResolvedValue(undefined),
      },
    };

    jest
      .spyOn(service as any, 'runSerializableTransaction')
      .mockImplementation(async (operation: (db: unknown) => unknown) => operation(tx));
    jest.spyOn(service as any, 'getRoomSummaryOrThrowTx').mockResolvedValue({
      id: 'room-mixed-1',
      name: 'Mixed Room',
      status: RoomStatus.WAITING,
      entryFee: 25,
      cardsPerPlayer: 2,
    });
    jest.spyOn(service as any, 'getPlayerCardsTx').mockResolvedValue([
      { id: 'existing-card-1', roomPlayerCardId: 'rpc-existing-1' },
      { id: 'new-card-2', roomPlayerCardId: 'rpc-new-2' },
    ]);

    const result = await service.selectCards('room-mixed-1', 'user-mixed-1', [
      'new-card-2',
    ]);

    expect(result).toEqual({
      cards: [
        { id: 'existing-card-1', roomPlayerCardId: 'rpc-existing-1' },
        { id: 'new-card-2', roomPlayerCardId: 'rpc-new-2' },
      ],
    });
    expect(ledgerService.applyEntry).toHaveBeenCalledTimes(1);
    expect(ledgerService.applyEntry).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        userId: 'user-mixed-1',
        amount: 25,
        balanceDelta: -25,
        type: TransactionType.GAME_ENTRY,
        gameRoomId: 'room-mixed-1',
        title: 'Room Entry: Mixed Room',
      }),
    );
    expect(tx.gameRoom.update).toHaveBeenCalledWith({
      where: { id: 'room-mixed-1' },
      data: { prizePool: { increment: 25 } },
    });
    expect(tx.roomPlayerCard.create).toHaveBeenCalledTimes(1);
  });
});
