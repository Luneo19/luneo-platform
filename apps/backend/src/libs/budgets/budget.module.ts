import { Module } from '@nestjs/common';
import { BudgetService } from './budget.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [BudgetService],
  exports: [BudgetService],
})
export class BudgetModule {}
































