/**
 * AR Collaboration - Sync State Service
 * Sync model state (position/rotation/scale) in real-time for rooms.
 * Designed to work with Socket.io gateway events (this service provides persistence/cache if needed).
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

export type ModelState = {
  modelId: string;
  userId: string;
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: number;
  updatedAt: string;
};

@Injectable()
export class SyncStateService {
  private readonly logger = new Logger(SyncStateService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Persist model state for a room (optional persistence; real-time can be via Socket.io)
   * Stores last known state in room metadata - use a JSON field if added to ARCollaborationRoom, or skip DB.
   * Here we use room's cloudAnchors as a generic store for "lastModelState" key for simplicity, or we could add a new column.
   * Schema has cloudAnchors only - so we use a separate in-memory cache or add modelState to a new field.
   * To avoid schema change, we'll use a key in a JSON column. But cloudAnchors is for anchors. So we don't persist model state in DB by default; gateway broadcasts. If you add room.modelState Json? to schema, we can persist. For now we just validate room exists and return a stub - gateway handles real-time.
   */
  async syncModelState(roomId: string, userId: string, modelState: Omit<ModelState, 'userId' | 'updatedAt'>) {
    this.logger.debug(`Sync model state in room ${roomId} by user ${userId}`);

    const room = await this.prisma.aRCollaborationRoom.findUnique({
      where: { id: roomId },
      select: { id: true },
    });
    if (!room) {
      throw new NotFoundException(`Room ${roomId} not found`);
    }

    const state: ModelState = {
      ...modelState,
      userId,
      updatedAt: new Date().toISOString(),
    };
    return state;
  }

  /**
   * Get current model state for room (from gateway/cache in real impl; here return empty if no persistence)
   */
  async getModelState(roomId: string): Promise<ModelState | null> {
    const room = await this.prisma.aRCollaborationRoom.findUnique({
      where: { id: roomId },
      select: { id: true },
    });
    if (!room) {
      throw new NotFoundException(`Room ${roomId} not found`);
    }
    return null;
  }
}
