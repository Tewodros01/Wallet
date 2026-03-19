import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../auth/decorators/get-user.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { PrismaService } from '../prisma/prisma.service';
import { CreateDepositDto, CreateWithdrawalDto } from './dto/payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(
    private readonly paymentsService: PaymentsService,
    private readonly prisma: PrismaService,
  ) {}

  @ApiOperation({ summary: 'List all agents' })
  @Get('agents')
  getAgents() {
    return this.paymentsService.getAgents();
  }

  @ApiOperation({ summary: 'Create a deposit (add money)' })
  @Post('deposit')
  createDeposit(@Body() dto: CreateDepositDto, @GetUser('sub') userId: string) {
    return this.paymentsService.createDeposit(dto, userId);
  }

  @ApiOperation({ summary: 'Get deposit history' })
  @Get('deposits')
  getDeposits(@GetUser('sub') userId: string) {
    return this.paymentsService.getDeposits(userId);
  }

  @ApiOperation({ summary: 'Transfer coins to another user' })
  @Post('transfer')
  transferCoins(
    @Body() dto: { recipientUsername: string; amount: number },
    @GetUser('sub') userId: string,
  ) {
    return this.paymentsService.transferCoins(
      userId,
      dto.recipientUsername,
      dto.amount,
    );
  }

  @ApiOperation({ summary: 'Create a withdrawal (get money)' })
  @Post('withdraw')
  createWithdrawal(
    @Body() dto: CreateWithdrawalDto,
    @GetUser('sub') userId: string,
  ) {
    return this.paymentsService.createWithdrawal(dto, userId);
  }

  @ApiOperation({ summary: 'Get withdrawal history' })
  @Get('withdrawals')
  getWithdrawals(@GetUser('sub') userId: string) {
    return this.paymentsService.getWithdrawals(userId);
  }

  @ApiOperation({ summary: 'Claim daily bonus' })
  @Post('daily-bonus')
  claimDailyBonus(
    @Body() dto: { coins: number },
    @GetUser('sub') userId: string,
  ) {
    return this.paymentsService.claimDailyBonus(userId, dto.coins);
  }

  @ApiOperation({ summary: 'Play Keno round' })
  @Post('keno/play')
  playKeno(
    @Body() dto: { bet: number; picks: number[] },
    @GetUser('sub') userId: string,
  ) {
    return this.paymentsService.playKeno(userId, dto.bet, dto.picks);
  }

  @ApiOperation({ summary: 'Agent: get all deposit/withdrawal requests' })
  @Get('agent/requests')
  getAgentRequests() {
    return this.paymentsService.getAgentRequests();
  }

  @ApiOperation({ summary: 'Agent: approve deposit' })
  @Post('agent/deposits/:id/approve')
  approveDeposit(@Param('id') id: string) {
    return this.paymentsService.agentApproveDeposit(id);
  }

  @ApiOperation({ summary: 'Agent: reject deposit' })
  @Post('agent/deposits/:id/reject')
  rejectDeposit(@Param('id') id: string) {
    return this.paymentsService.agentRejectDeposit(id);
  }

  @ApiOperation({ summary: 'Agent: approve withdrawal' })
  @Post('agent/withdrawals/:id/approve')
  approveWithdrawal(@Param('id') id: string) {
    return this.paymentsService.agentApproveWithdrawal(id);
  }

  @ApiOperation({ summary: 'Agent: reject withdrawal' })
  @Post('agent/withdrawals/:id/reject')
  rejectWithdrawal(@Param('id') id: string) {
    return this.paymentsService.agentRejectWithdrawal(id);
  }

  // ── Admin endpoints ──────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Admin: get all deposits' })
  @Get('admin/deposits')
  adminGetAllDeposits() {
    return this.prisma.deposit.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true,
          },
        },
      },
    });
  }

  @ApiOperation({ summary: 'Admin: get all withdrawals' })
  @Get('admin/withdrawals')
  adminGetAllWithdrawals() {
    return this.prisma.withdrawal.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            avatar: true,
            role: true,
          },
        },
      },
    });
  }

  @ApiOperation({ summary: 'Admin: approve deposit' })
  @Post('admin/deposits/:id/approve')
  adminApproveDeposit(@Param('id') id: string) {
    return this.paymentsService.agentApproveDeposit(id);
  }

  @ApiOperation({ summary: 'Admin: reject deposit' })
  @Post('admin/deposits/:id/reject')
  adminRejectDeposit(@Param('id') id: string) {
    return this.paymentsService.agentRejectDeposit(id);
  }

  @ApiOperation({ summary: 'Admin: approve withdrawal' })
  @Post('admin/withdrawals/:id/approve')
  adminApproveWithdrawal(@Param('id') id: string) {
    return this.paymentsService.agentApproveWithdrawal(id);
  }

  @ApiOperation({ summary: 'Admin: reject withdrawal' })
  @Post('admin/withdrawals/:id/reject')
  adminRejectWithdrawal(@Param('id') id: string) {
    return this.paymentsService.agentRejectWithdrawal(id);
  }
}
