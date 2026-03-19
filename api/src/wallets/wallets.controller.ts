import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetUser } from '../auth/decorators/get-user.decorators';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CreateWalletDto, UpdateWalletDto } from './dto/wallet.dto';
import { WalletsService } from './wallets.service';

@ApiTags('wallets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallets')
export class WalletsController {
  constructor(private readonly walletsService: WalletsService) {}

  @ApiOperation({ summary: 'Get all wallets' })
  @Get()
  findAll(@GetUser('sub') userId: string) {
    return this.walletsService.findAll(userId);
  }

  @ApiOperation({ summary: 'Get wallet stats / total balance' })
  @Get('stats')
  getStats(@GetUser('sub') userId: string) {
    return this.walletsService.getStats(userId);
  }

  @ApiOperation({ summary: 'Get a single wallet' })
  @Get(':id')
  findOne(@Param('id') id: string, @GetUser('sub') userId: string) {
    return this.walletsService.findOne(id, userId);
  }

  @ApiOperation({ summary: 'Create a wallet' })
  @Post()
  create(@Body() dto: CreateWalletDto, @GetUser('sub') userId: string) {
    return this.walletsService.create(dto, userId);
  }

  @ApiOperation({ summary: 'Update a wallet' })
  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateWalletDto,
    @GetUser('sub') userId: string,
  ) {
    return this.walletsService.update(id, dto, userId);
  }

  @ApiOperation({ summary: 'Delete a wallet' })
  @Delete(':id')
  remove(@Param('id') id: string, @GetUser('sub') userId: string) {
    return this.walletsService.remove(id, userId);
  }
}
