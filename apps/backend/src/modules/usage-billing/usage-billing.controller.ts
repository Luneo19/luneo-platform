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

  @Get('summary')
  @ApiOperation({ summary: 'Résumé d’usage mensuel (frontend-compatible)' })
  async summary(@CurrentUser() user: CurrentUserType) {
    const organizationId = user.organizationId;
    if (!organizationId) {
      throw new BadRequestException('Organisation requise');
    }
    const now = new Date();
    const from = new Date(now.getFullYear(), now.getMonth(), 1);
    const to = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    const ledger = await this.usageMeteringService.getUsageLedger(organizationId, { from, to });
    return {
      period: { from: from.toISOString(), to: to.toISOString() },
      totals: ledger.totals,
      entriesCount: Array.isArray(ledger.entries) ? ledger.entries.length : 0,
    };
  }

  @Get('topups/history')
  @ApiOperation({ summary: 'Historique topups (placeholder data model)' })
  async topupsHistory(@CurrentUser() user: CurrentUserType) {
    const organizationId = user.organizationId;
    if (!organizationId) {
      throw new BadRequestException('Organisation requise');
    }
    return {
      items: [],
      total: 0,
      organizationId,
    };
  }

  @Post('topups/simulate')
  @ApiOperation({ summary: 'Simulation coût topup' })
  async simulateTopup(
    @CurrentUser() user: CurrentUserType,
    @Body() body: { units?: number; unitPriceCents?: number },
  ) {
    const organizationId = user.organizationId;
    if (!organizationId) {
      throw new BadRequestException('Organisation requise');
    }
    const units = Math.max(1, Math.floor(Number(body?.units ?? 1)));
    const unitPriceCents = Math.max(0, Math.floor(Number(body?.unitPriceCents ?? 0)));
    return {
      organizationId,
      units,
      unitPriceCents,
      totalCents: units * unitPriceCents,
      currency: 'EUR',
    };
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

