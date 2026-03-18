import { Body, Controller, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../auth/decorators/get-user.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Get current user profile' })
  @Get('me')
  getMe(@GetUser('sub') userId: string) {
    return this.usersService.findOne(userId);
  }

  @ApiOperation({ summary: 'Update current user profile' })
  @Patch('me')
  updateMe(@GetUser('sub') userId: string, @Body() dto: UpdateUserDto) {
    return this.usersService.update(userId, dto);
  }

  @ApiOperation({ summary: 'Get current user game stats' })
  @Get('me/stats')
  getMyStats(@GetUser('sub') userId: string) {
    return this.usersService.getGameStats(userId);
  }

  @ApiOperation({ summary: 'Get leaderboard' })
  @Get('leaderboard')
  getLeaderboard(@Query('limit') limit?: number) {
    return this.usersService.getLeaderboard(limit);
  }

  @ApiOperation({ summary: 'Get a user by id' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
