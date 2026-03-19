import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
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
import { Role } from 'generated/prisma/client';
import { GetUser } from '../auth/decorators/get-user.decorators';
import { Roles } from '../auth/decorators/roles.decorator';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { UpdateRoleDto, UpdateUserDto } from './dto/update-user.dto';
import { UsersService } from './users.service';

@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @ApiOperation({ summary: 'Admin: adjust user coin balance' })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Patch(':id/coins')
  adjustCoins(
    @Param('id') id: string,
    @Body() dto: { amount: number; note?: string },
  ) {
    return this.usersService.adjustCoins(id, dto.amount, dto.note ?? '');
  }

  @ApiOperation({ summary: 'Admin: list all users' })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Get()
  findAll() {
    return this.usersService.findAll();
  }

  @ApiOperation({ summary: 'Admin: change a user role' })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Patch(':id/role')
  updateRole(@Param('id') id: string, @Body() dto: UpdateRoleDto) {
    return this.usersService.updateRole(id, dto.role);
  }

  @ApiOperation({ summary: 'Get current user profile' })
  @Get('me')
  getMe(@GetUser('sub') userId: string) {
    return this.usersService.findOne(userId);
  }

  @ApiOperation({ summary: 'Upload avatar (multipart/form-data, field: file)' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: { fileSize: 2 * 1024 * 1024 }, // 2 MB
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.startsWith('image/')) {
          return cb(new Error('Only image files are allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  @Post('me/avatar')
  uploadAvatar(
    @GetUser('sub') userId: string,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.usersService.uploadAvatar(userId, file);
  }

  @ApiOperation({ summary: 'Mark onboarding as complete for current user' })
  @Post('me/onboarding-done')
  completeOnboarding(@GetUser('sub') userId: string) {
    return this.usersService.completeOnboarding(userId);
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

  @ApiOperation({ summary: 'Admin: get agent stats by agent id' })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Get(':id/agent-stats')
  getAgentStats(@Param('id') id: string) {
    return this.usersService.getAgentStats(id);
  }

  @ApiOperation({ summary: 'Get game stats for any user' })
  @Get(':id/stats')
  getUserStats(@Param('id') id: string) {
    return this.usersService.getGameStats(id);
  }

  @ApiOperation({ summary: 'Get a user by id' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.usersService.findOne(id);
  }
}
