/**
 * AR Collaboration - Presence Service
 * Track user presence in rooms (heartbeat, active participants, cleanup stale)
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

const STALE_THRESHOLD_MS = 30_000; // 30 seconds

@Injectable()
export class PresenceService {
  private readonly logger = new Logger(PresenceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Update presence heartbeat for a user in a room
   */
  async updatePresence(roomId: string, userId: string) {
    const participant = await this.prisma.aRRoomParticipant.findFirst({
      where: { roomId, userId, leftAt: null },
    });
    if (!participant) {
      throw new NotFoundException('Participant not in room');
    }

    await this.prisma.aRRoomParticipant.update({
      where: { id: participant.id },
      data: { lastPingAt: new Date() },
    });

    return { ok: true };
  }

  /**
   * Get currently active participants (last ping within threshold)
   */
  async getActiveParticipants(roomId: string) {
    const room = await this.prisma.aRCollaborationRoom.findUnique({
      where: { id: roomId },
      select: { id: true },
    });
    if (!room) {
      throw new NotFoundException(`Room ${roomId} not found`);
    }

    const threshold = new Date(Date.now() - STALE_THRESHOLD_MS);
    const participants = await this.prisma.aRRoomParticipant.findMany({
      where: { roomId, leftAt: null, lastPingAt: { gte: threshold } },
      orderBy: { lastPingAt: 'desc' },
    });

    return participants;
  }

  /**
   * Remove stale presence (mark leftAt for users with no ping in 30s)
   */
  async cleanupStalePresence() {
    this.logger.log('Cleaning up stale presence');

    const threshold = new Date(Date.now() - STALE_THRESHOLD_MS);
    const result = await this.prisma.aRRoomParticipant.updateMany({
      where: { leftAt: null, lastPingAt: { lt: threshold } },
      data: { leftAt: new Date() },
    });

    return { updated: result.count };
  }
}
