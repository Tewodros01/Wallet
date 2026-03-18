import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { GetUser } from '../auth/decorators/get-user.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AgentsService } from './agents.service';

class UseCodeDto {
  @IsString()
  code!: string;
}

@ApiTags('agents')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('agents')
export class AgentsController {
  constructor(private readonly agentsService: AgentsService) {}

  @ApiOperation({ summary: 'Get my referral invite (auto-creates if none)' })
  @Get('my-invite')
  getMyInvite(@GetUser('sub') userId: string) {
    return this.agentsService.getMyInvite(userId);
  }

  @ApiOperation({ summary: 'Get agent stats (invited count, commission)' })
  @Get('stats')
  getStats(@GetUser('sub') userId: string) {
    return this.agentsService.getAgentStats(userId);
  }

  @ApiOperation({ summary: 'Use an invite code' })
  @Post('use-code')
  useCode(@Body() dto: UseCodeDto, @GetUser('sub') userId: string) {
    return this.agentsService.useInviteCode(dto.code, userId);
  }
}
