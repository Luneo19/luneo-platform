import { Module } from '@nestjs/common';
import { CronJobsController } from './cron-jobs.controller';
import { CronJobsService } from './cron-jobs.service';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { EmailModule } from '@/modules/email/email.module';
import { CreditsModule } from '@/libs/credits/credits.module';

@Module({
  imports: [PrismaModule, ConfigModule, EmailModule, CreditsModule],
  controllers: [CronJobsController],
  providers: [CronJobsService],
  exports: [CronJobsService],
})
export class CronJobsModule {}
