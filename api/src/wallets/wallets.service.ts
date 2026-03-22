import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from 'generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { CreateWalletDto, UpdateWalletDto } from './dto/wallet.dto';

const walletSelect = {
  id: true,
  name: true,
  balance: true,
  currency: true,
  isDefault: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

const walletOrderBy: Prisma.WalletOrderByWithRelationInput[] = [
  { isDefault: 'desc' },
  { createdAt: 'asc' },
];

@Injectable()
export class WalletsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(userId: string) {
    try {
      return await this.prisma.wallet.findMany({
        where: { userId, deletedAt: null, isActive: true },
        select: walletSelect,
        orderBy: walletOrderBy,
      });
    } catch {
      throw new InternalServerErrorException('Failed to fetch wallets');
    }
  }

  async findOne(id: string, userId: string) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { id, userId, deletedAt: null },
      select: walletSelect,
    });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }

  async create(dto: CreateWalletDto, userId: string) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        if (dto.isDefault) {
          await tx.wallet.updateMany({
            where: { userId, deletedAt: null },
            data: { isDefault: false },
          });
        }

        const count = await tx.wallet.count({
          where: { userId, deletedAt: null },
        });
        const isFirst = count === 0;
        const hasDefault = await tx.wallet.count({
          where: { userId, deletedAt: null, isDefault: true, isActive: true },
        });

        return tx.wallet.create({
          data: {
            name: dto.name,
            currency: dto.currency,
            userId,
            isDefault: dto.isDefault ?? (isFirst || hasDefault === 0),
          },
          select: walletSelect,
        });
      });
    } catch {
      throw new InternalServerErrorException('Failed to create wallet');
    }
  }

  async update(id: string, dto: UpdateWalletDto, userId: string) {
    const wallet = await this.assertOwnership(id, userId);
    try {
      return await this.prisma.$transaction(async (tx) => {
        if (wallet.isDefault && dto.isDefault === false) {
          throw new BadRequestException(
            'Default wallet cannot be unset without choosing another default wallet',
          );
        }

        if (dto.isDefault) {
          await tx.wallet.updateMany({
            where: { userId, deletedAt: null },
            data: { isDefault: false },
          });
        }
        return tx.wallet.update({
          where: { id },
          data: dto,
          select: walletSelect,
        });
      });
    } catch {
      throw new InternalServerErrorException('Failed to update wallet');
    }
  }

  async remove(id: string, userId: string) {
    const wallet = await this.assertOwnership(id, userId);
    if (wallet.isDefault) {
      throw new BadRequestException('Cannot delete the default wallet');
    }
    try {
      return await this.prisma.wallet.update({
        where: { id },
        data: { deletedAt: new Date(), isActive: false },
        select: { id: true, deletedAt: true },
      });
    } catch {
      throw new InternalServerErrorException('Failed to delete wallet');
    }
  }

  async getStats(userId: string) {
    try {
      const wallets = await this.prisma.wallet.findMany({
        where: { userId, deletedAt: null, isActive: true },
        select: { balance: true, currency: true },
      });
      const totalBalance = wallets.reduce((s, w) => s + Number(w.balance), 0);
      return { totalBalance, walletCount: wallets.length, wallets };
    } catch {
      throw new InternalServerErrorException('Failed to fetch wallet stats');
    }
  }

  private async assertOwnership(id: string, userId: string) {
    const wallet = await this.prisma.wallet.findFirst({
      where: { id, userId, deletedAt: null },
      select: { id: true, isDefault: true },
    });
    if (!wallet) throw new NotFoundException('Wallet not found');
    return wallet;
  }
}
