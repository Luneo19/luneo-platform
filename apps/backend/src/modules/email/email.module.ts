import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bull';
import { PrismaModule } from '@/libs/prisma/prisma.module';
import { EmailService } from './email.service';
import { MailgunService } from './mailgun.service';
import { SendGridService } from './sendgrid.service';
import { SMTPService } from './smtp.service';
import { EmailController } from './email.controller';
import { EmailProcessor } from './email.processor';
import { SendGridEventsController } from './sendgrid-events.controller';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    BullModule.registerQueue({
      name: 'email',
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 2000,
        },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    }),
  ],
  providers: [
    EmailService,
    MailgunService,
    SendGridService,
    SMTPService,
    EmailProcessor,
  ],
  controllers: [EmailController, SendGridEventsController],
  exports: [EmailService, MailgunService, SendGridService, SMTPService],
})
export class EmailModule {}
