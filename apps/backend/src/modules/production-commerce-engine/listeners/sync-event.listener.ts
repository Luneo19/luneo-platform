import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { PCE_EVENTS } from '../pce.constants';

@Injectable()
export class SyncEventListener {
  private readonly logger = new Logger(SyncEventListener.name);

  @OnEvent(PCE_EVENTS.SYNC_STARTED)
  handleSyncStarted(payload: { connectionId: string; type: string }): void {
    this.logger.log(`Sync started: ${payload.type} for connection ${payload.connectionId}`);
  }

  @OnEvent(PCE_EVENTS.SYNC_COMPLETED)
  handleSyncCompleted(payload: { connectionId: string; type: string }): void {
    this.logger.log(`Sync completed: ${payload.type} for connection ${payload.connectionId}`);
  }

  @OnEvent(PCE_EVENTS.SYNC_FAILED)
  handleSyncFailed(payload: { connectionId: string; type: string; error?: string }): void {
    this.logger.warn(`Sync failed: ${payload.type} for connection ${payload.connectionId} - ${payload.error ?? 'unknown'}`);
    // Trigger notifications on failures (e.g. queue a notification job or emit to notification service)
    // For now we only log; can be extended to inject NotificationProcessor or EventEmitter for notification events.
  }
}
