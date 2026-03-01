import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '@/common/types/user.types';
import { CreateWebhookDto } from './dto/create-webhook.dto';
import { WebhooksService } from './webhooks.service';

@ApiTags('webhooks')
@Controller('webhooks')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class WebhooksController {
  constructor(private readonly webhooksService: WebhooksService) {}

  @Get()
  @ApiOperation({ summary: 'Lister les webhooks sortants de l organisation' })
  async list(@CurrentUser() user: CurrentUserType) {
    return this.webhooksService.listForOrganization(user);
  }

  @Post()
  @ApiOperation({ summary: 'Creer un webhook sortant' })
  async create(
    @CurrentUser() user: CurrentUserType,
    @Body() dto: CreateWebhookDto,
  ) {
    return this.webhooksService.createForOrganization(user, dto);
  }

  @Post(':id/test')
  @ApiOperation({ summary: 'Envoyer un webhook de test' })
  async test(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.webhooksService.testWebhook(user, id);
  }

  @Get('failed-jobs')
  @ApiOperation({ summary: 'Lister les deliveries webhook en echec (DLQ)' })
  async listFailed(
    @CurrentUser() user: CurrentUserType,
    @Query('limit') limit?: string,
  ) {
    return this.webhooksService.listFailedJobs(user, limit ? Number(limit) : 50);
  }

  @Post('failed-jobs/:id/replay')
  @ApiOperation({ summary: 'Relancer manuellement un job webhook en echec' })
  async replay(@CurrentUser() user: CurrentUserType, @Param('id') id: string) {
    return this.webhooksService.replayFailedJob(user, id);
  }
}
