import { Controller, Post, Body, Logger, Headers } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { EmailInboundService } from './email-inbound.service';

@ApiTags('Channels - Email Inbound')
@Controller('channels/email')
@Public()
export class EmailInboundController {
  private readonly logger = new Logger(EmailInboundController.name);

  constructor(private readonly emailInboundService: EmailInboundService) {}

  @Post('inbound')
  @ApiOperation({ summary: 'Receive inbound email from SendGrid/Mailgun' })
  async handleInboundEmail(
    @Body() body: Record<string, unknown>,
    @Headers() headers: Record<string, string>,
  ) {
    this.logger.log('Received inbound email webhook');

    // Parse email based on provider format
    const parsedEmail = this.emailInboundService.parseInboundEmail(body);

    // Process the email (find channel, create conversation, generate reply)
    await this.emailInboundService.processInboundEmail(parsedEmail);

    return { received: true };
  }
}
