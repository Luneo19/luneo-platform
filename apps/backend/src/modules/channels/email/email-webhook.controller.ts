import { Controller, Post, Body, Logger, HttpCode } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Public } from '@/common/decorators/public.decorator';
import { EmailInboundService } from './email-inbound.service';

@ApiTags('Webhooks')
@Controller('webhooks/email')
export class EmailWebhookController {
  private readonly logger = new Logger(EmailWebhookController.name);

  constructor(private readonly emailInbound: EmailInboundService) {}

  @Post('inbound')
  @Public()
  @HttpCode(200)
  @ApiOperation({ summary: 'SendGrid Inbound Parse webhook' })
  async handleInbound(@Body() body: Record<string, unknown>) {
    this.logger.log('Received inbound email webhook');

    try {
      await this.emailInbound.processInboundEmail(body);
    } catch (error: unknown) {
      this.logger.error(
        'Failed to process inbound email',
        error instanceof Error ? error.message : String(error),
      );
    }

    return { received: true };
  }
}
