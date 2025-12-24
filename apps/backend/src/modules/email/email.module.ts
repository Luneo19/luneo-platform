import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EmailService } from './email.service';
import { MailgunService } from './mailgun.service';
import { SendGridService } from './sendgrid.service';
import { SMTPService } from './smtp.service';
import { EmailController } from './email.controller';

@Module({
  imports: [ConfigModule],
  providers: [EmailService, MailgunService, SendGridService, SMTPService],
  controllers: [EmailController],
  exports: [EmailService, MailgunService, SendGridService, SMTPService],
})
export class EmailModule {}
