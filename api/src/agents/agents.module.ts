import { Module } from '@nestjs/common';
import { LedgerModule } from '../ledger/ledger.module';
import { MissionsModule } from '../missions/missions.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TelegramModule } from '../telegram/telegram.module';
import { AgentsController } from './agents.controller';
import { AgentsService } from './agents.service';

@Module({
  imports: [PrismaModule, MissionsModule, TelegramModule, LedgerModule],
  controllers: [AgentsController],
  providers: [AgentsService],
  exports: [AgentsService],
})
export class AgentsModule {}
