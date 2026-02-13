import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SetupKeyGuard } from '@/common/guards/setup-key.guard';
import { BillingModule } from '@/modules/billing/billing.module';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { EmailModule } from '@/modules/email/email.module';

@Module({
  imports: [PrismaModule, EmailModule, ConfigModule, BillingModule],
  controllers: [AdminController],
  providers: [AdminService, SetupKeyGuard],
  exports: [AdminService],
})
export class AdminModule {}
