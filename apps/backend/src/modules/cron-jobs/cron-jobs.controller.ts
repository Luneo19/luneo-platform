import {
  Controller,
  Get,
  Post,
  Headers,
  UnauthorizedException,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { CronJobsService } from './cron-jobs.service';
import { Public } from '@/common/decorators/public.decorator';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';

@ApiTags('Cron Jobs')
@Controller('cron')
@UseGuards(JwtAuthGuard)
export class CronJobsController {
  constructor(private readonly cronJobsService: CronJobsService) {}

  /**
   * Vérifie si la requête provient d'un service de cron autorisé
   */
  private verifyCronSecret(authHeader: string | null): boolean {
    const cronSecret = process.env.CRON_SECRET;
    if (!cronSecret) {
      // Si pas de secret configuré, permettre l'accès (pour développement)
      return true;
    }
    return authHeader === `Bearer ${cronSecret}`;
  }

  @Public()
  @Get('analytics-digest')
  @Post('analytics-digest')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Génère un résumé analytique hebdomadaire' })
  @ApiResponse({ status: 200, description: 'Résumé généré avec succès' })
  async analyticsDigest(@Headers('authorization') authHeader: string | null) {
    if (!this.verifyCronSecret(authHeader)) {
      throw new UnauthorizedException('Unauthorized cron job');
    }

    return this.cronJobsService.generateAnalyticsDigest();
  }

  @Public()
  @Get('cleanup')
  @Post('cleanup')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Nettoie les anciennes données' })
  @ApiResponse({ status: 200, description: 'Nettoyage terminé' })
  async cleanup(@Headers('authorization') authHeader: string | null) {
    if (!this.verifyCronSecret(authHeader)) {
      throw new UnauthorizedException('Unauthorized cron job');
    }

    return this.cronJobsService.cleanupOldData();
  }
}
