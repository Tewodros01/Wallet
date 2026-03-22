import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Role } from 'generated/prisma/client';
import type { ActiveUser } from '../auth/decorators/get-user.decorators';
import { GetUser } from '../auth/decorators/get-user.decorators';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import {
  PROOF_UPLOAD_MIME_TYPES,
  storeUploadedFile,
  validateUploadMimeType,
} from '../common/utils/upload.util';
import { PrismaService } from '../prisma/prisma.service';
import {
  CreateDepositDto,
  CreateWithdrawalDto,
  PlayKenoDto,
  TransferCoinsDto,
} from './dto/payment.dto';
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

  @ApiOperation({ summary: 'Upload payment proof image/PDF' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
      fileFilter: (_req, file, cb) => {
        try {
          validateUploadMimeType(
            file.mimetype,
            PROOF_UPLOAD_MIME_TYPES,
            'Only JPG, PNG, WEBP, GIF, and PDF files are allowed',
          );
          cb(null, true);
        } catch (error) {
          return cb(error as Error, false);
        }
      },
    }),
  )
  @Post('proof/upload')
  uploadProof(@UploadedFile() file: Express.Multer.File) {
    return {
      proofUrl: storeUploadedFile({
        file,
        subdirectory: 'proofs',
        allowedMimeTypes: PROOF_UPLOAD_MIME_TYPES,
        fallbackExtension: '.bin',
        errorMessage: 'Only JPG, PNG, WEBP, GIF, and PDF files are allowed',
      }),
    };
  }

  @ApiOperation({ summary: 'Create a deposit (add money)' })
  @Throttle({ short: { ttl: 60000, limit: 5 } })
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
  @Throttle({ short: { ttl: 60000, limit: 10 } })
  @Post('transfer')
  transferCoins(@Body() dto: TransferCoinsDto, @GetUser('sub') userId: string) {
    return this.paymentsService.transferCoins(
      userId,
      dto.recipientUsername,
      dto.amount,
    );
  }

  @ApiOperation({ summary: 'Create a withdrawal (get money)' })
  @Throttle({ short: { ttl: 60000, limit: 5 } })
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
  @Throttle({ short: { ttl: 60000, limit: 5 } })
  @Post('daily-bonus')
  claimDailyBonus(@GetUser('sub') userId: string) {
    return this.paymentsService.claimDailyBonus(userId);
  }

  @ApiOperation({ summary: 'Play Keno round' })
  @Throttle({ short: { ttl: 60000, limit: 20 } })
  @Post('keno/play')
  playKeno(@Body() dto: PlayKenoDto, @GetUser('sub') userId: string) {
    return this.paymentsService.playKeno(userId, dto.bet, dto.picks);
  }

  @ApiOperation({ summary: 'Get Keno bet history for current user' })
  @Get('keno/history')
  getKenoHistory(@GetUser('sub') userId: string) {
    return this.paymentsService.getKenoHistory(userId);
  }

  @ApiOperation({ summary: 'Agent: get all deposit/withdrawal requests' })
  @Roles(Role.AGENT, Role.ADMIN)
  @UseGuards(RolesGuard)
  @Get('agent/requests')
  getAgentRequests(@GetUser() user: ActiveUser) {
    return this.paymentsService.getAgentRequests(user);
  }

  @ApiOperation({ summary: 'Agent: approve deposit' })
  @Roles(Role.AGENT, Role.ADMIN)
  @UseGuards(RolesGuard)
  @Throttle({ short: { ttl: 60000, limit: 30 } })
  @Post('agent/deposits/:id/approve')
  approveDeposit(@Param('id') id: string, @GetUser() user: ActiveUser) {
    return this.paymentsService.agentApproveDeposit(id, user);
  }

  @ApiOperation({ summary: 'Agent: reject deposit' })
  @Roles(Role.AGENT, Role.ADMIN)
  @UseGuards(RolesGuard)
  @Throttle({ short: { ttl: 60000, limit: 30 } })
  @Post('agent/deposits/:id/reject')
  rejectDeposit(@Param('id') id: string, @GetUser() user: ActiveUser) {
    return this.paymentsService.agentRejectDeposit(id, user);
  }

  @ApiOperation({ summary: 'Agent: approve withdrawal' })
  @Roles(Role.AGENT, Role.ADMIN)
  @UseGuards(RolesGuard)
  @Throttle({ short: { ttl: 60000, limit: 30 } })
  @Post('agent/withdrawals/:id/approve')
  approveWithdrawal(@Param('id') id: string, @GetUser() user: ActiveUser) {
    return this.paymentsService.agentApproveWithdrawal(id, user);
  }

  @ApiOperation({ summary: 'Agent: reject withdrawal' })
  @Roles(Role.AGENT, Role.ADMIN)
  @UseGuards(RolesGuard)
  @Throttle({ short: { ttl: 60000, limit: 30 } })
  @Post('agent/withdrawals/:id/reject')
  rejectWithdrawal(@Param('id') id: string, @GetUser() user: ActiveUser) {
    return this.paymentsService.agentRejectWithdrawal(id, user);
  }

  // ── Admin endpoints ──────────────────────────────────────────────────────

  @ApiOperation({ summary: 'Admin: get all deposits' })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Get('admin/deposits')
  adminGetAllDeposits() {
    return this.paymentsService.getAdminDeposits();
  }

  @ApiOperation({
    summary:
      'Admin: analytics — daily deposit/withdrawal totals for last 30 days',
  })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Get('admin/analytics')
  async adminAnalytics() {
    const since = new Date();
    since.setDate(since.getDate() - 29);
    since.setHours(0, 0, 0, 0);

    const [deposits, withdrawals, users] = await Promise.all([
      this.prisma.deposit.findMany({
        where: { createdAt: { gte: since }, status: 'COMPLETED' },
        select: { amount: true, createdAt: true },
      }),
      this.prisma.withdrawal.findMany({
        where: { createdAt: { gte: since }, status: 'COMPLETED' },
        select: { amount: true, createdAt: true },
      }),
      this.prisma.user.findMany({
        where: { createdAt: { gte: since } },
        select: { createdAt: true },
      }),
    ]);

    // Build a map of day → totals
    const days: Record<
      string,
      { date: string; deposits: number; withdrawals: number; newUsers: number }
    > = {};
    for (let i = 0; i < 30; i++) {
      const d = new Date(since);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      days[key] = { date: key, deposits: 0, withdrawals: 0, newUsers: 0 };
    }

    for (const dep of deposits) {
      const key = dep.createdAt.toISOString().slice(0, 10);
      if (days[key]) days[key].deposits += Number(dep.amount);
    }
    for (const wd of withdrawals) {
      const key = wd.createdAt.toISOString().slice(0, 10);
      if (days[key]) days[key].withdrawals += Number(wd.amount);
    }
    for (const u of users) {
      const key = u.createdAt.toISOString().slice(0, 10);
      if (days[key]) days[key].newUsers += 1;
    }

    return Object.values(days);
  }

  @ApiOperation({ summary: 'Admin: get all withdrawals' })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Get('admin/withdrawals')
  adminGetAllWithdrawals() {
    return this.paymentsService.getAdminWithdrawals();
  }

  @ApiOperation({ summary: 'Admin: approve deposit' })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Post('admin/deposits/:id/approve')
  adminApproveDeposit(@Param('id') id: string, @GetUser() user: ActiveUser) {
    return this.paymentsService.agentApproveDeposit(id, user);
  }

  @ApiOperation({ summary: 'Admin: reject deposit' })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Post('admin/deposits/:id/reject')
  adminRejectDeposit(@Param('id') id: string, @GetUser() user: ActiveUser) {
    return this.paymentsService.agentRejectDeposit(id, user);
  }

  @ApiOperation({ summary: 'Admin: approve withdrawal' })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Post('admin/withdrawals/:id/approve')
  adminApproveWithdrawal(@Param('id') id: string, @GetUser() user: ActiveUser) {
    return this.paymentsService.agentApproveWithdrawal(id, user);
  }

  @ApiOperation({ summary: 'Admin: reject withdrawal' })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Post('admin/withdrawals/:id/reject')
  adminRejectWithdrawal(@Param('id') id: string, @GetUser() user: ActiveUser) {
    return this.paymentsService.agentRejectWithdrawal(id, user);
  }
}
