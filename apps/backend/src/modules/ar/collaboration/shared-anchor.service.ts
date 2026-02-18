/**
 * AR Collaboration - Shared Anchor Service
 * Share AR anchors between users in a room (stored in room cloudAnchors JSON)
 */

import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

export type AnchorData = {
  id: string;
  userId: string;
  position?: { x: number; y: number; z: number };
  rotation?: { x: number; y: number; z: number };
  scale?: number;
  type?: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

@Injectable()
export class SharedAnchorService {
  private readonly logger = new Logger(SharedAnchorService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Share an anchor in the room (append to cloudAnchors)
   */
  async shareAnchor(roomId: string, userId: string, anchorData: Omit<AnchorData, 'userId' | 'createdAt'>) {
    this.logger.log(`Sharing anchor ${anchorData.id} in room ${roomId}`);

    const room = await this.prisma.aRCollaborationRoom.findUnique({
      where: { id: roomId },
      select: { id: true, cloudAnchors: true },
    });
    if (!room) {
      throw new NotFoundException(`Room ${roomId} not found`);
    }

    const anchors: AnchorData[] = Array.isArray(room.cloudAnchors) ? (room.cloudAnchors as AnchorData[]) : [];
    const entry: AnchorData = {
      ...anchorData,
      userId,
      createdAt: new Date().toISOString(),
    };
    const filtered = anchors.filter((a) => a.id !== entry.id);
    filtered.push(entry);

    await this.prisma.aRCollaborationRoom.update({
      where: { id: roomId },
      data: { cloudAnchors: filtered as object },
    });

    return entry;
  }

  /**
   * Get all shared anchors for a room
   */
  async getSharedAnchors(roomId: string): Promise<AnchorData[]> {
    const room = await this.prisma.aRCollaborationRoom.findUnique({
      where: { id: roomId },
      select: { cloudAnchors: true },
    });
    if (!room) {
      throw new NotFoundException(`Room ${roomId} not found`);
    }

    return Array.isArray(room.cloudAnchors) ? (room.cloudAnchors as AnchorData[]) : [];
  }

  /**
   * Remove an anchor from the room
   */
  async removeAnchor(roomId: string, anchorId: string) {
    this.logger.log(`Removing anchor ${anchorId} from room ${roomId}`);

    const room = await this.prisma.aRCollaborationRoom.findUnique({
      where: { id: roomId },
      select: { id: true, cloudAnchors: true },
    });
    if (!room) {
      throw new NotFoundException(`Room ${roomId} not found`);
    }

    const anchors: AnchorData[] = Array.isArray(room.cloudAnchors) ? (room.cloudAnchors as AnchorData[]) : [];
    const filtered = anchors.filter((a) => a.id !== anchorId);

    await this.prisma.aRCollaborationRoom.update({
      where: { id: roomId },
      data: { cloudAnchors: filtered as object },
    });

    return { removed: true, anchorId };
  }
}
