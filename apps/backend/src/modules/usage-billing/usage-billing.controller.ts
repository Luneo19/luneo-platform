import {
  BadRequestException,
  Body,
  Controller,
  ForbiddenException,
  Get,
  Headers,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { CurrentUser as CurrentUserType } from '@/common/types/user.types';
import { UsageMeteringService } from './usage-metering.service';

@ApiTags('usage-billing')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('usage-billing')
export class UsageBillingController {
  constructor(private readonly usageMeteringService: UsageMeteringService) {}

  @Post('record')
  @ApiOperation({ summary: 'Désactivé: écriture usage backend-only' })
  async record(
    @CurrentUser() _user: CurrentUserType,
  ) {
    throw new ForbiddenException(
      'Endpoint désactivé: l’enregistrement d’usage est réservé aux flux backend internes.',
    );
  }

  @Get('ledger')
  @ApiOperation({ summary: 'Lire le ledger d’usage' })
  async ledger(
    @CurrentUser() user: CurrentUserType,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    const organizationId = user.organizationId;
    if (!organizationId) {
      throw new BadRequestException('Organisation requise');
    }
    const range =
      from || to
        ? {
            from: from ? new Date(from) : new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
            to: to ? new Date(to) : new Date(),
          }
        : undefined;
    return this.usageMeteringService.getUsageLedger(organizationId, range);
  }

  @Post('reconcile')
  @ApiOperation({ summary: 'Réconcilier facture Stripe vs usage mesuré' })
  async reconcile(
    @CurrentUser() user: CurrentUserType,
    @Body() body: { stripeInvoiceId: string },
    @Headers('x-idempotency-key') idempotencyKey?: string,
  ) {
    const organizationId = user.organizationId;
    if (!organizationId) {
      throw new BadRequestException('Organisation requise');
    }
    return this.usageMeteringService.reconcileInvoiceUsage(
      organizationId,
      body.stripeInvoiceId,
      idempotencyKey,
    );
  }
}

