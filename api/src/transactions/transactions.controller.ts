import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { Role } from 'generated/prisma/client';
import { GetUser } from 'src/auth/decorators/get-user.decorators';
import { Roles } from 'src/auth/decorators/roles.decorator';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { RolesGuard } from 'src/auth/guards/roles.guard';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateTransactionDto } from './dto/create-transaction.dto';
import { QueryTransactionDto } from './dto/query-transaction.dto';
import { UpdateTransactionDto } from './dto/update-transaction.dto';
import { TransactionsService } from './transactions.service';

@ApiTags('transactions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('transactions')
export class TransactionsController {
  constructor(
    private readonly transactionsService: TransactionsService,
    private readonly prisma: PrismaService,
  ) {}

  @ApiOperation({ summary: 'Admin: get all transactions' })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Get('admin/all')
  adminGetAll(
    @Query('limit') limit = 100,
    @Query('skip') skip = 0,
  ) {
    return this.prisma.transaction.findMany({
      where: { deletedAt: null },
      orderBy: { date: 'desc' },
      take: Number(limit),
      skip: Number(skip),
      select: {
        id: true, title: true, amount: true, type: true,
        status: true, date: true, createdAt: true,
        user: { select: { id: true, username: true, firstName: true, lastName: true, avatar: true } },
        wallet: { select: { id: true, name: true, currency: true } },
      },
    });
  }

  @ApiOperation({ summary: 'Admin: get transactions for a specific user' })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Get('user/:userId')
  getUserTransactions(@Param('userId') userId: string) {
    return this.prisma.transaction.findMany({
      where: { userId, deletedAt: null },
      orderBy: { date: 'desc' },
      take: 50,
      select: {
        id: true, title: true, amount: true, type: true,
        status: true, date: true, createdAt: true, note: true,
      },
    });
  }

  @ApiOperation({ summary: 'Create a transaction' })
  @ApiResponse({ status: 201, description: 'Transaction created' })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @Post()
  @HttpCode(HttpStatus.CREATED)
  create(@Body() dto: CreateTransactionDto, @GetUser('sub') userId: string) {
    return this.transactionsService.create(dto, userId);
  }

  @ApiOperation({ summary: 'Get all transactions with filtering & pagination' })
  @ApiResponse({ status: 200, description: 'Returns paginated transactions' })
  @Get()
  findAll(@Query() query: QueryTransactionDto, @GetUser('sub') userId: string) {
    return this.transactionsService.findAll(userId, query);
  }

  @ApiOperation({ summary: 'Get transaction summary / financial report' })
  @ApiResponse({ status: 200, description: 'Returns financial summary' })
  @Get('summary')
  getSummary(
    @GetUser('sub') userId: string,
    @Query('walletId') walletId?: string,
    @Query('month') month?: string,
  ) {
    return this.transactionsService.getSummary(userId, walletId, month);
  }

  @ApiOperation({ summary: 'Get a single transaction' })
  @ApiResponse({ status: 200, description: 'Returns transaction' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @Get(':id')
  findOne(@Param('id') id: string, @GetUser('sub') userId: string) {
    return this.transactionsService.findOne(id, userId);
  }

  @ApiOperation({ summary: 'Update a transaction' })
  @ApiResponse({ status: 200, description: 'Transaction updated' })
  @ApiResponse({ status: 400, description: 'Transfer cannot be edited' })
  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateTransactionDto,
    @GetUser('sub') userId: string,
  ) {
    return this.transactionsService.update(id, dto, userId);
  }

  @ApiOperation({ summary: 'Soft delete a transaction' })
  @ApiResponse({ status: 200, description: 'Transaction deleted' })
  @Delete(':id')
  remove(@Param('id') id: string, @GetUser('sub') userId: string) {
    return this.transactionsService.remove(id, userId);
  }
}
