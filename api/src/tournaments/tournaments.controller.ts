import { Body, Controller, Get, Param, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Role } from 'generated/prisma/client';
import { GetUser } from '../auth/decorators/get-user.decorators';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CreateTournamentDto } from './dto/tournament.dto';
import { TournamentsService } from './tournaments.service';

@ApiTags('tournaments')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('tournaments')
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @ApiOperation({ summary: 'List all tournaments' })
  @Get()
  findAll(@GetUser('sub') userId: string) {
    return this.tournamentsService.findAll(userId);
  }

  @ApiOperation({ summary: 'Get tournament leaderboard' })
  @Get('leaderboard')
  getLeaderboard() {
    return this.tournamentsService.getLeaderboard();
  }

  @ApiOperation({ summary: 'Get total active prize pool' })
  @Get('prize-pool')
  getPrizePool() {
    return this.tournamentsService.getTotalPrizePool();
  }

  @ApiOperation({ summary: 'Get a single tournament' })
  @Get(':id')
  findOne(@Param('id') id: string, @GetUser('sub') userId: string) {
    return this.tournamentsService.findOne(id, userId);
  }

  @ApiOperation({ summary: 'Join a tournament' })
  @Post(':id/join')
  join(@Param('id') id: string, @GetUser('sub') userId: string) {
    return this.tournamentsService.join(id, userId);
  }

  @ApiOperation({ summary: 'Admin: create a tournament' })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Post()
  create(@Body() dto: CreateTournamentDto) {
    return this.tournamentsService.create(dto);
  }

  @ApiOperation({ summary: 'Admin: finish tournament and pay out winner' })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Post(':id/finish')
  finish(
    @Param('id') id: string,
    @Body() dto: { winnerUserId: string },
  ) {
    return this.tournamentsService.finishTournament(id, dto.winnerUserId);
  }
}
