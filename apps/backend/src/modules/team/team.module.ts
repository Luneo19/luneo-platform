import { Module } from '@nestjs/common';
import { TeamController } from './team.controller';
import { TeamService } from './team.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { PlansModule } from '../plans/plans.module';

@Module({
  imports: [PrismaModule, PlansModule],
  controllers: [TeamController],
  providers: [TeamService],
  exports: [TeamService],
})
export class TeamModule {}
