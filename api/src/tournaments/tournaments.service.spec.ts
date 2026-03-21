import {
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import {
  TournamentStatus,
  TransactionType,
} from 'generated/prisma/client';
import { TournamentsService } from './tournaments.service';

describe('TournamentsService', () => {
  const createService = () => {
    const prisma = {
      tournament: {
        findUnique: jest.fn(),
      },
      tournamentPlayer: {
        findUnique: jest.fn(),
      },
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

    const service = new TournamentsService(
      prisma as any,
      missionsService as any,
      configService as any,
      ledgerService as any,
    );

    return { service, prisma, ledgerService };
  };

  it('credits the winner through the ledger when a tournament is finished', async () => {
    const { service, prisma, ledgerService } = createService();
    prisma.tournament.findUnique.mockResolvedValue({
      id: 'tour-1',
      name: 'Weekend Cup',
      prize: 500,
      status: TournamentStatus.LIVE,
      _count: { players: 12 },
    });
    prisma.tournamentPlayer.findUnique.mockResolvedValue({
      tournamentId: 'tour-1',
      userId: 'winner-1',
    });
    const tx = {
      tournament: {
        update: jest.fn().mockResolvedValue(undefined),
      },
      notification: {
        create: jest.fn().mockResolvedValue(undefined),
      },
    };
    prisma.$transaction.mockImplementation(
      async (callback: (db: unknown) => unknown) => callback(tx),
    );

    const result = await service.finishTournament('tour-1', 'winner-1');

    expect(result).toEqual({
      success: true,
      winner: 'winner-1',
      prize: 500,
    });
    expect(ledgerService.applyEntry).toHaveBeenCalledWith(
      tx,
      expect.objectContaining({
        userId: 'winner-1',
        amount: 500,
        balanceDelta: 500,
        type: TransactionType.GAME_WIN,
      }),
    );
  });

  it('throws when the winner is not a registered tournament player', async () => {
    const { service, prisma } = createService();
    prisma.tournament.findUnique.mockResolvedValue({
      id: 'tour-2',
      name: 'Weekend Cup',
      prize: 500,
      status: TournamentStatus.LIVE,
      _count: { players: 12 },
    });
    prisma.tournamentPlayer.findUnique.mockResolvedValue(null);

    await expect(
      service.finishTournament('tour-2', 'unknown-user'),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('throws when the tournament does not exist', async () => {
    const { service, prisma } = createService();
    prisma.tournament.findUnique.mockResolvedValue(null);

    await expect(
      service.finishTournament('missing', 'winner-1'),
    ).rejects.toBeInstanceOf(NotFoundException);
  });
});
