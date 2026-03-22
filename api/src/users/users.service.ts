import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  FinancialAccountProvider,
  FinancialAccountType,
  Prisma,
  Role,
} from 'generated/prisma/client';
import {
  getPublicApiUrl,
  toPublicAssetUrl,
} from '../common/utils/avatar-url.util';
import {
  IMAGE_UPLOAD_MIME_TYPES,
  storeUploadedFile,
} from '../common/utils/upload.util';
import { LedgerService } from '../ledger/ledger.service';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateFinancialAccountDto,
  UpdateFinancialAccountDto,
  UpdateUserDto,
} from './dto/update-user.dto';

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

const userSelect = {
  id: true,
  username: true,
  email: true,
  firstName: true,
  lastName: true,
  phone: true,
  avatar: true,
  bio: true,
  role: true,
  coinsBalance: true,
  isVerified: true,
  onboardingDone: true,
  createdAt: true,
  financialAccounts: {
    where: { isActive: true },
    orderBy: financialAccountOrderBy,
    select: financialAccountSelect,
  },
} as const;

@Injectable()
export class UsersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly ledgerService: LedgerService,
  ) {}

  async findAll() {
    const users = await this.prisma.user.findMany({
      select: { ...userSelect, role: true, deletedAt: true },
      orderBy: { createdAt: 'desc' },
    });
    return users.map((user) => this.serializeUser(user));
  }

  async updateRole(id: string, role: Role, adminId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');
    if (id === adminId && role !== Role.ADMIN) {
      throw new BadRequestException('You cannot change your own admin role');
    }
    if (user.role === Role.ADMIN && role !== Role.ADMIN) {
      const activeAdminCount = await this.prisma.user.count({
        where: { role: Role.ADMIN, deletedAt: null },
      });
      if (activeAdminCount <= 1) {
        throw new BadRequestException('At least one active admin is required');
      }
    }
    const updatedUser = await this.prisma.user.update({
      where: { id },
      data: { role },
      select: userSelect,
    });
    return this.serializeUser(updatedUser);
  }

  async findOne(id: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
      select: userSelect,
    });
    if (!user) throw new NotFoundException('User not found');
    return this.serializeUser(user);
  }

  async update(id: string, dto: UpdateUserDto) {
    try {
      const user = await this.prisma.user.update({
        where: { id },
        data: dto,
        select: userSelect,
      });
      return this.serializeUser(user);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        const target = (error.meta?.target as string[]) ?? [];
        if (target.includes('username'))
          throw new ConflictException('Username already taken');
        if (target.includes('phone'))
          throw new ConflictException('Phone already in use');
      }
      throw new InternalServerErrorException('Failed to update profile');
    }
  }

  async getFinancialAccounts(userId: string) {
    return this.prisma.financialAccount.findMany({
      where: { userId, isActive: true },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      select: financialAccountSelect,
    });
  }

  async createFinancialAccount(
    userId: string,
    dto: CreateFinancialAccountDto,
  ) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const hasDefault = await tx.financialAccount.count({
          where: { userId, isActive: true, isDefault: true },
        });
        const shouldBeDefault = dto.isDefault ?? (hasDefault === 0);

        if (shouldBeDefault) {
          await tx.financialAccount.updateMany({
            where: { userId, isActive: true },
            data: { isDefault: false },
          });
        }

        return tx.financialAccount.create({
          data: {
            userId,
            provider: dto.provider,
            type: this.getFinancialAccountType(dto.provider),
            accountNumber: dto.accountNumber.trim(),
            accountName: dto.accountName?.trim() || null,
            label: dto.label?.trim() || null,
            isDefault: shouldBeDefault,
          },
          select: financialAccountSelect,
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('This financial account already exists');
      }
      throw new InternalServerErrorException(
        'Failed to create financial account',
      );
    }
  }

  async updateFinancialAccount(
    userId: string,
    accountId: string,
    dto: UpdateFinancialAccountDto,
  ) {
    const existing = await this.prisma.financialAccount.findFirst({
      where: { id: accountId, userId, isActive: true },
      select: financialAccountSelect,
    });
    if (!existing) throw new NotFoundException('Financial account not found');

    if (existing.isDefault && dto.isDefault === false) {
      throw new BadRequestException(
        'Default account cannot be unset directly. Choose another default account instead.',
      );
    }

    try {
      return await this.prisma.$transaction(async (tx) => {
        if (dto.isDefault) {
          await tx.financialAccount.updateMany({
            where: { userId, isActive: true },
            data: { isDefault: false },
          });
        }

        const provider = dto.provider ?? existing.provider;

        return tx.financialAccount.update({
          where: { id: accountId },
          data: {
            provider,
            type: this.getFinancialAccountType(provider),
            accountNumber: dto.accountNumber?.trim(),
            accountName:
              dto.accountName !== undefined
                ? dto.accountName.trim() || null
                : undefined,
            label: dto.label !== undefined ? dto.label.trim() || null : undefined,
            isDefault: dto.isDefault,
          },
          select: financialAccountSelect,
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException('This financial account already exists');
      }
      throw new InternalServerErrorException(
        'Failed to update financial account',
      );
    }
  }

  async removeFinancialAccount(userId: string, accountId: string) {
    const existing = await this.prisma.financialAccount.findFirst({
      where: { id: accountId, userId, isActive: true },
      select: financialAccountSelect,
    });
    if (!existing) throw new NotFoundException('Financial account not found');

    await this.prisma.$transaction(async (tx) => {
      await tx.financialAccount.delete({
        where: { id: accountId },
      });

      if (existing.isDefault) {
        const replacement = await tx.financialAccount.findFirst({
          where: { userId, isActive: true },
          orderBy: { createdAt: 'asc' },
          select: { id: true },
        });

        if (replacement) {
          await tx.financialAccount.update({
            where: { id: replacement.id },
            data: { isDefault: true },
          });
        }
      }
    });

    return { success: true };
  }

  async uploadAvatar(userId: string, file: Express.Multer.File) {
    const avatarUrl = storeUploadedFile({
      file,
      subdirectory: 'avatars',
      allowedMimeTypes: IMAGE_UPLOAD_MIME_TYPES,
      fallbackExtension: '.jpg',
      filenamePrefix: userId,
      errorMessage: 'Only JPG, PNG, WEBP, and GIF files are allowed',
    });
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { avatar: avatarUrl },
      select: userSelect,
    });
    return {
      avatarUrl: this.toPublicAssetUrl(avatarUrl),
      user: this.serializeUser(user),
    };
  }

  async getGameStats(userId: string) {
    try {
      const [totalGames, wins, totalEarned] = await this.prisma.$transaction([
        this.prisma.roomPlayer.count({ where: { userId } }),
        this.prisma.roomPlayer.count({ where: { userId, hasBingo: true } }),
        this.prisma.roomPlayer.aggregate({
          where: { userId },
          _sum: { prize: true },
        }),
      ]);

      const losses = totalGames - wins;
      const winRate =
        totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;

      return {
        totalGames,
        wins,
        losses,
        winRate,
        totalEarned: totalEarned._sum.prize ?? 0,
      };
    } catch {
      throw new InternalServerErrorException('Failed to fetch game stats');
    }
  }

  async getAgentStats(agentId: string) {
    try {
      const agent = await this.prisma.user.findFirst({
        where: { id: agentId, deletedAt: null },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
          phone: true,
          email: true,
          coinsBalance: true,
          createdAt: true,
          role: true,
          financialAccounts: {
            where: { isActive: true },
            orderBy: financialAccountOrderBy,
            select: financialAccountSelect,
          },
        },
      });
      if (!agent) throw new NotFoundException('Agent not found');

      const invite = await this.prisma.agentInvite.findFirst({
        where: { inviterId: agentId },
        include: {
          invitedUsers: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              avatar: true,
              createdAt: true,
            },
          },
        },
      });

      const invitedIds = invite?.invitedUsers.map((u) => u.id) ?? [];

      const [deposits, withdrawals] = await Promise.all([
        this.prisma.deposit.findMany({
          where: invitedIds.length
            ? { userId: { in: invitedIds } }
            : { id: 'none' },
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        }),
        this.prisma.withdrawal.findMany({
          where: invitedIds.length
            ? { userId: { in: invitedIds } }
            : { id: 'none' },
          orderBy: { createdAt: 'desc' },
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                avatar: true,
              },
            },
          },
        }),
      ]);

      const totalDepositCoins = deposits
        .filter((d) => d.status === 'COMPLETED')
        .reduce((s, d) => s + Number(d.amount), 0);
      const totalWithdrawalCoins = withdrawals
        .filter((w) => w.status === 'COMPLETED')
        .reduce((s, w) => s + Number(w.amount), 0);
      const pendingDeposits = deposits.filter(
        (d) => d.status === 'PENDING',
      ).length;
      const pendingWithdrawals = withdrawals.filter(
        (w) => w.status === 'PENDING' || w.status === 'PROCESSING',
      ).length;

      return {
        agent: this.serializeUser(agent),
        invite: invite
          ? {
              code: invite.code,
              status: invite.status,
              commission: invite.commission,
              usedAt: invite.usedAt,
            }
          : null,
        invitedUsers:
          invite?.invitedUsers.map((user) => this.serializeUser(user)) ?? [],
        deposits: deposits.map((deposit) => ({
          ...deposit,
          user: deposit.user ? this.serializeUser(deposit.user) : deposit.user,
        })),
        withdrawals: withdrawals.map((withdrawal) => ({
          ...withdrawal,
          user: withdrawal.user
            ? this.serializeUser(withdrawal.user)
            : withdrawal.user,
        })),
        summary: {
          totalInvited: invitedIds.length,
          totalDepositCoins,
          totalWithdrawalCoins,
          pendingDeposits,
          pendingWithdrawals,
          totalDeposits: deposits.length,
          totalWithdrawals: withdrawals.length,
          commission: invite?.commission ?? 0,
        },
      };
    } catch (error) {
      if (error instanceof NotFoundException) throw error;
      throw new InternalServerErrorException('Failed to fetch agent stats');
    }
  }

  async completeOnboarding(userId: string) {
    const user = await this.prisma.user.update({
      where: { id: userId },
      data: { onboardingDone: true },
      select: userSelect,
    });
    return this.serializeUser(user);
  }

  async adjustCoins(id: string, amount: number, note: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');
    if (amount < 0 && user.coinsBalance + amount < 0) {
      throw new BadRequestException('Adjustment would make balance negative');
    }
    const updated = await this.prisma.$transaction(async (tx) => {
      const newBalance = await this.ledgerService.applyEntry(tx, {
        userId: id,
        title: note || (amount >= 0 ? 'Admin credit' : 'Admin debit'),
        amount: Math.abs(amount),
        balanceDelta: amount,
        type: amount >= 0 ? 'INCOME' : 'EXPENSE',
      });
      return { coinsBalance: newBalance };
    });
    return { newBalance: updated.coinsBalance };
  }

  async banUser(id: string, adminId: string) {
    const user = await this.prisma.user.findFirst({
      where: { id, deletedAt: null },
    });
    if (!user) throw new NotFoundException('User not found');
    if (id === adminId) {
      throw new BadRequestException('You cannot ban your own account');
    }
    if (user.role === Role.ADMIN) {
      const activeAdminCount = await this.prisma.user.count({
        where: { role: Role.ADMIN, deletedAt: null },
      });
      if (activeAdminCount <= 1) {
        throw new BadRequestException('At least one active admin is required');
      }
    }
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: userSelect,
    });
  }

  async unbanUser(id: string) {
    return this.prisma.user.update({
      where: { id },
      data: { deletedAt: null },
      select: userSelect,
    });
  }

  async getLeaderboard(limit = 10) {
    try {
      const players = await this.prisma.roomPlayer.groupBy({
        by: ['userId'],
        _sum: { prize: true },
        _count: { hasBingo: true },
        orderBy: { _sum: { prize: 'desc' } },
        take: limit,
      });

      const userIds = players.map((p) => p.userId);
      const users = await this.prisma.user.findMany({
        where: { id: { in: userIds } },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          avatar: true,
        },
      });

      const userMap = new Map<string, (typeof users)[number]>(
        users.map((u) => [u.id, u]),
      );

      return players.map((p, i) => ({
        rank: i + 1,
        user: userMap.get(p.userId)
          ? this.serializeUser(userMap.get(p.userId)!)
          : null,
        totalEarned: p._sum.prize ?? 0,
        wins: p._count.hasBingo,
      }));
    } catch {
      throw new InternalServerErrorException('Failed to fetch leaderboard');
    }
  }

  private getPublicApiUrl() {
    return getPublicApiUrl(this.configService);
  }

  private toPublicAssetUrl(path: string | null) {
    return toPublicAssetUrl(path, this.getPublicApiUrl());
  }

  private getFinancialAccountType(provider: FinancialAccountProvider) {
    switch (provider) {
      case FinancialAccountProvider.TELEBIRR:
      case FinancialAccountProvider.MPESA:
      case FinancialAccountProvider.CBE_BIRR:
      case FinancialAccountProvider.OTHER_WALLET:
        return FinancialAccountType.MOBILE_WALLET;
      case FinancialAccountProvider.BOA:
      case FinancialAccountProvider.OTHER_BANK:
        return FinancialAccountType.BANK_ACCOUNT;
      default:
        return FinancialAccountType.BANK_ACCOUNT;
    }
  }

  private serializeUser<T extends { avatar: string | null }>(user: T): T {
    return {
      ...user,
      avatar: this.toPublicAssetUrl(user.avatar),
    };
  }
}
