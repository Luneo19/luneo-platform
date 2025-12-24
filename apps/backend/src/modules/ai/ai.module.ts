import { Module } from '@nestjs/common';
import { AiController } from './ai.controller';
import { AiService } from './ai.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { BudgetModule } from '@/libs/budgets/budget.module';

@Module({
  imports: [PrismaModule, BudgetModule],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
