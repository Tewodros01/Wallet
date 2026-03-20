import { Module } from '@nestjs/common';
import { MissionsModule } from '../missions/missions.module';
import { PrismaModule } from '../prisma/prisma.module';
import { TournamentsController } from './tournaments.controller';
import { TournamentsService } from './tournaments.service';

@Module({
  imports: [PrismaModule, MissionsModule],
  controllers: [TournamentsController],
  providers: [TournamentsService],
  exports: [TournamentsService],
})
export class TournamentsModule {}
