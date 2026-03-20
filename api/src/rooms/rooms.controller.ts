import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Role } from 'generated/prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { GetUser } from '../auth/decorators/get-user.decorators';
import { RolesGuard } from '../auth/guards/roles.guard';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  ClaimBingoDto,
  CreateRoomDto,
  JoinRoomDto,
  QueryRoomsDto,
  SelectRoomCardsDto,
} from './dto/room.dto';
import { RoomsService } from './rooms.service';

@ApiTags('rooms')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  @ApiOperation({ summary: 'Get all rooms (lobby)' })
  @Get()
  findAll(@Query() query: QueryRoomsDto) {
    return this.roomsService.findAll(query);
  }

  @ApiOperation({ summary: 'Get my game history' })
  @Get('history')
  getHistory(@GetUser('sub') userId: string) {
    return this.roomsService.getGameHistory(userId);
  }

  @ApiOperation({ summary: 'Get a single room' })
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.roomsService.findOne(id);
  }

  @ApiOperation({ summary: 'Create a room' })
  @Post()
  create(@Body() dto: CreateRoomDto, @GetUser('sub') userId: string) {
    return this.roomsService.create(dto, userId);
  }

  @ApiOperation({ summary: 'Admin: remove a room' })
  @Roles(Role.ADMIN)
  @UseGuards(RolesGuard)
  @Throttle({ short: { ttl: 60000, limit: 20 } })
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.roomsService.remove(id);
  }

  @ApiOperation({ summary: 'Join a room' })
  @Post(':id/join')
  join(
    @Param('id') id: string,
    @Body() dto: JoinRoomDto,
    @GetUser('sub') userId: string,
  ) {
    return this.roomsService.join(id, userId, dto);
  }

  @ApiOperation({ summary: 'Get my player record + card for a room' })
  @Get(':id/my-player')
  getMyPlayer(@Param('id') id: string, @GetUser('sub') userId: string) {
    return this.roomsService.getMyPlayer(id, userId);
  }

  @ApiOperation({ summary: 'Get available cards for this room' })
  @Get(':id/cards/available')
  getAvailableCards(@Param('id') id: string, @GetUser('sub') userId: string) {
    return this.roomsService.getAvailableCards(id, userId);
  }

  @ApiOperation({ summary: 'Select cards for this room' })
  @Post(':id/cards/select')
  selectCards(
    @Param('id') id: string,
    @Body() dto: SelectRoomCardsDto,
    @GetUser('sub') userId: string,
  ) {
    return this.roomsService.selectCards(id, userId, dto.cardIds);
  }

  @ApiOperation({ summary: 'Start the game (host only)' })
  @Post(':id/start')
  start(@Param('id') id: string, @GetUser('sub') userId: string) {
    return this.roomsService.startGame(id, userId);
  }

  @ApiOperation({ summary: 'Claim BINGO' })
  @Post(':id/bingo')
  claimBingo(
    @Param('id') id: string,
    @Body() dto: ClaimBingoDto,
    @GetUser('sub') userId: string,
  ) {
    return this.roomsService.claimBingo(id, userId, dto.cardId);
  }
}
