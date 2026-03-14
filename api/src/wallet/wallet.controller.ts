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
import { GetUser } from 'src/auth/decorators/get-user.decorators';
import { JwtAuthGuard } from 'src/auth/guards/jwt-auth.guard';
import { CreateWalletDto } from './dto/create-wallet.dto';
import { UpdateWalletDto } from './dto/update-wallet.dto';
import { WalletService } from './wallet.service';

@ApiTags('wallets')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('wallets')
export class WalletController {
  constructor(private readonly walletService: WalletService) {}

  @ApiOperation({ summary: 'Create a wallet' })
  @Post()
  create(
    @GetUser('sub') userId: string,
    @Body() createWalletDto: CreateWalletDto,
  ) {
    return this.walletService.create(createWalletDto, userId);
  }

  @ApiOperation({ summary: 'Get all wallets' })
  @Get()
  findAll(@GetUser('sub') userId: string) {
    return this.walletService.findAll(userId);
  }

  @ApiOperation({ summary: 'Get a wallet stats' })
  @Get(':id/stats')
  getStats(@GetUser('sub') userId: string, @Param('id') id: string) {
    return this.walletService.getStats(id, userId);
  }

  @ApiOperation({ summary: 'Get a wallet' })
  @Get(':id')
  findOne(@GetUser('sub') userId: string, @Param('id') id: string) {
    return this.walletService.findOne(id, userId);
  }

  @ApiOperation({ summary: 'Update a wallet' })
  @Patch(':id')
  update(
    @GetUser('sub') userId: string,
    @Param('id') id: string,
    @Body() updateWalletDto: UpdateWalletDto,
  ) {
    return this.walletService.update(id, userId, updateWalletDto);
  }

  @ApiOperation({ summary: 'Delete a wallet' })
  @Delete(':id')
  remove(@GetUser('sub') userId: string, @Param('id') id: string) {
    return this.walletService.remove(id, userId);
  }
}
