import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../auth/decorators/get-user.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateDepositDto, CreateWithdrawalDto } from './dto/payment.dto';
import { PaymentsService } from './payments.service';

@ApiTags('payments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

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

  @ApiOperation({ summary: 'Create a withdrawal (get money)' })
  @Post('withdraw')
  createWithdrawal(@Body() dto: CreateWithdrawalDto, @GetUser('sub') userId: string) {
    return this.paymentsService.createWithdrawal(dto, userId);
  }

  @ApiOperation({ summary: 'Get withdrawal history' })
  @Get('withdrawals')
  getWithdrawals(@GetUser('sub') userId: string) {
    return this.paymentsService.getWithdrawals(userId);
  }

  @ApiOperation({ summary: 'Claim daily bonus' })
  @Post('daily-bonus')
  claimDailyBonus(@Body() dto: { coins: number }, @GetUser('sub') userId: string) {
    return this.paymentsService.claimDailyBonus(userId, dto.coins);
  }

  @ApiOperation({ summary: 'Agent: get all deposit/withdrawal requests' })
  @Get('agent/requests')
  getAgentRequests(@GetUser('sub') userId: string) {
    return this.paymentsService.getAgentRequests(userId);
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
}
