import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { SLOService } from '../services/slo-sli.service';
import { DRService } from '../services/dr.service';

@Injectable()
export class ObservabilityScheduler {
  private readonly logger = new Logger(ObservabilityScheduler.name);

  constructor(
    private readonly sloService: SLOService,
    private readonly drService: DRService,
  ) {}

  /**
   * Évalue tous les SLO (toutes les heures)
   */
  @Cron('0 * * * *')
  async evaluateSLOs() {
    this.logger.log('Evaluating all SLOs...');
    try {
      const results = await this.sloService.evaluateAllSLOs();
      await this.sloService.saveSLOResults(results);
      
      const breaches = results.filter((r) => r.status === 'breach');
      if (breaches.length > 0) {
        this.logger.error(`SLO breaches detected: ${breaches.length}`, breaches);
      }
      
      this.logger.log(`SLO evaluation completed: ${results.length} SLOs evaluated`);
    } catch (error) {
      this.logger.error('Failed to evaluate SLOs:', error);
    }
  }

  /**
   * Crée un backup de la base de données (tous les jours à 2h du matin)
   */
  @Cron('0 2 * * *')
  async createDailyBackup() {
    this.logger.log('Creating daily database backup...');
    try {
      const backup = await this.drService.createDatabaseBackup();
      this.logger.log(`Daily backup created: ${backup.id}`);
    } catch (error) {
      this.logger.error('Failed to create daily backup:', error);
    }
  }

  /**
   * Nettoie les anciens backups (tous les dimanches à 3h du matin)
   */
  @Cron('0 3 * * 0')
  async cleanupOldBackups() {
    this.logger.log('Cleaning up old backups...');
    try {
      const deletedCount = await this.drService.cleanupOldBackups(30); // 30 jours retention
      this.logger.log(`Cleaned up ${deletedCount} old backups`);
    } catch (error) {
      this.logger.error('Failed to cleanup old backups:', error);
    }
  }
}




























