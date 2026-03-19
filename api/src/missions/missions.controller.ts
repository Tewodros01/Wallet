import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { MissionType, Role } from 'generated/prisma/client';
import { GetUser } from '../auth/decorators/get-user.decorators';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { MissionsService } from './missions.service';

@ApiTags('missions')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('missions')
export class MissionsController {
  constructor(private readonly missionsService: MissionsService) {}

  @ApiOperation({ summary: 'Get all missions with user progress' })
  @Get()
  getMissions(
    @GetUser('sub') userId: string,
    @Query('type') type?: MissionType,
  ) {
    return this.missionsService.getMissions(userId, type);
  }

  @ApiOperation({ summary: 'Get login streak' })
  @Get('streak')
  getStreak(@GetUser('sub') userId: string) {
    return this.missionsService.getStreak(userId);
  }

  @ApiOperation({ summary: 'Claim mission reward' })
  @Post(':id/claim')
  claim(@Param('id') id: string, @GetUser('sub') userId: string) {
    return this.missionsService.claimMission(id, userId);
  }

  @ApiOperation({ summary: 'Admin: create a mission' })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Post()
  createMission(
    @Body()
    dto: {
      title: string;
      desc: string;
      reward: number;
      total: number;
      type: string;
      category: string;
      icon?: string;
    },
  ) {
    return this.missionsService.createMission(dto);
  }

  @ApiOperation({ summary: 'Admin: update a mission' })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Patch(':id')
  updateMission(
    @Param('id') id: string,
    @Body()
    dto: Partial<{
      title: string;
      desc: string;
      reward: number;
      total: number;
      isActive: boolean;
      icon: string;
    }>,
  ) {
    return this.missionsService.updateMission(id, dto);
  }

  @ApiOperation({ summary: 'Admin: delete a mission' })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Delete(':id')
  deleteMission(@Param('id') id: string) {
    return this.missionsService.deleteMission(id);
  }

  @ApiOperation({ summary: 'Seed default missions (dev/admin)' })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Post('seed')
  seed() {
    return this.missionsService.seedMissions();
  }
}
