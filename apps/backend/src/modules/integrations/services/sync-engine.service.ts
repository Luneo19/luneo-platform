/**
 * @fileoverview Service de synchronisation des données
 * @module SyncEngineService
 */

import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue } from 'bull';

@Injectable()
export class SyncEngineService {
  private readonly logger = new Logger(SyncEngineService.name);

  constructor(
    @InjectQueue('integration-sync') private readonly syncQueue: Queue,
  ) {}

  /**
   * Lance une synchronisation pour une intégration
   */
  async triggerSync(integrationId: string, syncType: string): Promise<void> {
    await this.syncQueue.add('sync-integration', {
      integrationId,
      syncType,
    });

    this.logger.log(`Sync queued for integration ${integrationId}`);
  }
}
