import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';

@Injectable()
export class WalletService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateWalletDto, userId: string) {
    try {
      if (dto.isDefault) {
        await this.prisma.wallet.updateMany({
          where: { userId, deletedAt: null },
          data: {
            isDefault: false,
          },
        });
      }
      return this.prisma.wallet.create({
        data: {
          ...dto,
          userId,
        },
      });
    } catch {
      throw new InternalServerErrorException('Failed to create');
    }
  }

  async findAll(userId: string) {
    try {
      return this.prisma.wallet.findMany({
        where: { userId, deletedAt: null },
        orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
      });
    } catch {
      throw new InternalServerErrorException('Failed to fetch');
    }
  }

  async findOne(id: string, userId: string) {
    try {
      const wallet = await this.prisma.wallet.findFirst({
        where: { id, userId, deletedAt: null },
      });
      if (!wallet) {
        throw new NotFoundException('Wallet not found');
      }

      return wallet;
    } catch {
      throw new InternalServerErrorException('Failed to fetch');
    }
  }

  async update(id: string, userId: string, dto: UpdateWalletDto) {
    try {
      await this.findOne(id, userId);

      if (dto.isDefault) {
        await this.prisma.wallet.updateMany({
          where: { userId, deletedAt: null },
          data: {
            isDefault: false,
          },
        });
      }

      return this.prisma.wallet.update({
        where: { id },
        data: dto,
      });
    } catch {
      throw new InternalServerErrorException('Failed to update');
    }
  }

  async remove(id: string, userid: string) {
    try {
      const wallet = await this.findOne(userid, id);

      if (wallet.isDefault) {
        throw new BadRequestException('Cannot delete your default wallet');
      }

      return this.prisma.wallet.update({
        where: { id },
        data: { deletedAt: new Date() },
      });
    } catch {
      throw new InternalServerErrorException('Failed to remove');
    }
  }

  async getStats(id: string, userId: string) {
    try {
      await this.findOne(id, userId);
      const [income, expense] = await Promise.all([
        this.prisma.transaction.aggregate({
          where: { walletId: id, type: 'INCOME', deletedAt: null },
          _sum: { amount: true },
        }),
        this.prisma.transaction.aggregate({
          where: { walletId: id, type: 'EXPENSE', deletedAt: null },
          _sum: { amount: true },
        }),
      ]);

      return {
        totalIncome: income._sum.amount ?? 0,
        totalExpense: expense._sum.amount ?? 0,
      };
    } catch {
      throw new InternalServerErrorException('Failed to fetch stats');
    }
  }
}
