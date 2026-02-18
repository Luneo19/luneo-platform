/**
 * AR Collaboration - Room Service
 * Create/join/leave/end AR collaboration rooms
 */

import { Injectable, Logger, NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import type { ARRoomStatus } from '@prisma/client';

export type CreateRoomOptions = {
  name?: string;
  maxParticipants?: number;
  allowVoiceChat?: boolean;
  allowAnnotations?: boolean;
  allowModelEditing?: boolean;
};

@Injectable()
export class ARRoomService {
  private readonly logger = new Logger(ARRoomService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Create an AR collaboration room for a project
   */
  async createRoom(projectId: string, hostUserId: string, options: CreateRoomOptions = {}) {
    this.logger.log(`Creating AR room for project ${projectId}, host ${hostUserId}`);

    const project = await this.prisma.aRProject.findUnique({
      where: { id: projectId },
      select: { id: true, brandId: true },
    });
    if (!project) {
      throw new NotFoundException(`Project ${projectId} not found`);
    }

    const room = await this.prisma.aRCollaborationRoom.create({
      data: {
        projectId,
        name: options.name ?? `Room ${Date.now()}`,
        hostUserId,
        status: 'WAITING',
        maxParticipants: options.maxParticipants ?? 10,
        allowVoiceChat: options.allowVoiceChat ?? true,
        allowAnnotations: options.allowAnnotations ?? true,
        allowModelEditing: options.allowModelEditing ?? false,
      },
      include: {
        project: { select: { id: true, name: true } },
        participants: true,
      },
    });

    return room;
  }

  /**
   * Join room as participant
   */
  async joinRoom(roomId: string, userId: string, platform: string, role: string = 'viewer') {
    this.logger.log(`User ${userId} joining room ${roomId} on ${platform}`);

    const room = await this.prisma.aRCollaborationRoom.findUnique({
      where: { id: roomId },
      include: { participants: true },
    });
    if (!room) {
      throw new NotFoundException(`Room ${roomId} not found`);
    }
    if (room.status === 'ENDED') {
      throw new BadRequestException('Room has ended');
    }

    const count = room.participants.filter((p) => !p.leftAt).length;
    if (count >= room.maxParticipants) {
      throw new BadRequestException('Room is full');
    }

    const existing = room.participants.find((p) => p.userId === userId && !p.leftAt);
    if (existing) {
      await this.prisma.aRRoomParticipant.update({
        where: { id: existing.id },
        data: { lastPingAt: new Date(), platform },
      });
      return this.getRoomDetails(roomId);
    }

    await this.prisma.aRRoomParticipant.create({
      data: { roomId, userId, platform, role: userId === room.hostUserId ? 'host' : role },
    });

    await this.prisma.aRCollaborationRoom.update({
      where: { id: roomId },
      data: { status: 'ACTIVE' as ARRoomStatus },
    });

    return this.getRoomDetails(roomId);
  }

  /**
   * Leave room
   */
  async leaveRoom(roomId: string, userId: string) {
    this.logger.log(`User ${userId} leaving room ${roomId}`);

    const participant = await this.prisma.aRRoomParticipant.findFirst({
      where: { roomId, userId, leftAt: null },
    });
    if (!participant) {
      throw new NotFoundException('Participant not in room or already left');
    }

    await this.prisma.aRRoomParticipant.update({
      where: { id: participant.id },
      data: { leftAt: new Date() },
    });

    const room = await this.prisma.aRCollaborationRoom.findUnique({
      where: { id: roomId },
      include: { participants: true },
    });
    if (room) {
      const activeCount = room.participants.filter((p) => !p.leftAt).length;
      if (activeCount === 0) {
        await this.prisma.aRCollaborationRoom.update({
          where: { id: roomId },
          data: { status: 'ENDED' as ARRoomStatus, endedAt: new Date() },
        });
      }
    }

    return { left: true };
  }

  /**
   * End room (host only)
   */
  async endRoom(roomId: string, hostUserId: string) {
    this.logger.log(`Host ${hostUserId} ending room ${roomId}`);

    const room = await this.prisma.aRCollaborationRoom.findUnique({
      where: { id: roomId },
    });
    if (!room) {
      throw new NotFoundException(`Room ${roomId} not found`);
    }
    if (room.hostUserId !== hostUserId) {
      throw new ForbiddenException('Only the host can end the room');
    }
    if (room.status === 'ENDED') {
      throw new BadRequestException('Room already ended');
    }

    await this.prisma.aRCollaborationRoom.update({
      where: { id: roomId },
      data: { status: 'ENDED', endedAt: new Date() },
    });

    await this.prisma.aRRoomParticipant.updateMany({
      where: { roomId, leftAt: null },
      data: { leftAt: new Date() },
    });

    return this.getRoomDetails(roomId);
  }

  /**
   * Get room details with participants
   */
  async getRoomDetails(roomId: string) {
    const room = await this.prisma.aRCollaborationRoom.findUnique({
      where: { id: roomId },
      include: {
        project: { select: { id: true, name: true } },
        participants: { orderBy: { joinedAt: 'asc' } },
      },
    });
    if (!room) {
      throw new NotFoundException(`Room ${roomId} not found`);
    }
    return room;
  }

  /**
   * List active rooms for a project
   */
  async listRooms(projectId: string) {
    this.logger.log(`Listing rooms for project ${projectId}`);

    const rooms = await this.prisma.aRCollaborationRoom.findMany({
      where: { projectId, status: { in: ['WAITING', 'ACTIVE'] } },
      include: {
        participants: { where: { leftAt: null } },
        _count: { select: { participants: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    return rooms;
  }
}
