import { Module } from '@nestjs/common';
import { MissionsModule } from '../missions/missions.module';
import { PrismaModule } from '../prisma/prisma.module';
import { RoomsController } from './rooms.controller';
import { RoomsService } from './rooms.service';

@Module({
  imports: [PrismaModule, MissionsModule],
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
