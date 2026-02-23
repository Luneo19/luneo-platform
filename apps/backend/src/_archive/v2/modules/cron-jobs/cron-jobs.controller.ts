import {
  Controller,
  Get,
  Post,
  Headers,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
  UseGuards,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { timingSafeEqual } from 'crypto';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CronJobsService } from './cron-jobs.service';
import { Public } from '@/common/decorators/public.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@ApiTags('Cron Jobs')
@Controller('cron')
@UseGuards(JwtAuthGuard)
export class CronJobsController {
  private readonly logger = new Logger(CronJobsController.name);

  constructor(
    private readonly cronJobsService: CronJobsService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Vérifie si la requête provient d'un service de cron autorisé
   */
  private verifyCronSecret(secret: string): boolean {
    const cronSecret = this.configService.get<string>('CRON_SECRET') || process.env.CRON_SECRET;

    // In production, CRON_SECRET must be set
    if (!cronSecret) {
      const nodeEnv = this.configService.get<string>('NODE_ENV') || process.env.NODE_ENV;
      if (nodeEnv === 'production') {
        this.logger.error('CRON_SECRET is not configured in production');
        return false;
      }
      // Allow in development without secret
      return true;
    }

    if (!secret || Buffer.byteLength(secret) !== Buffer.byteLength(cronSecret)) {
      return false;
    }
    return timingSafeEqual(Buffer.from(secret), Buffer.from(cronSecret));
  }

  /** @Public: called by cron scheduler; verified by Bearer secret */
  @Public()
  @Get('analytics-digest')
  @Post('analytics-digest')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Génère un résumé analytique hebdomadaire' })
  @ApiResponse({ status: 200, description: 'Résumé généré avec succès' })
  async analyticsDigest(@Headers('authorization') authHeader: string | null) {
    const secret = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader ?? '';
    if (!this.verifyCronSecret(secret)) {
      throw new UnauthorizedException('Unauthorized cron job');
    }

    return this.cronJobsService.generateAnalyticsDigest();
  }

  /** @Public: called by cron scheduler; verified by Bearer secret */
  @Public()
  @Get('cleanup')
  @Post('cleanup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Nettoie les anciennes données' })
  @ApiResponse({ status: 200, description: 'Nettoyage terminé' })
  async cleanup(@Headers('authorization') authHeader: string | null) {
    const secret = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : authHeader ?? '';
    if (!this.verifyCronSecret(secret)) {
      throw new UnauthorizedException('Unauthorized cron job');
    }

    return this.cronJobsService.cleanupOldData();
  }
}
