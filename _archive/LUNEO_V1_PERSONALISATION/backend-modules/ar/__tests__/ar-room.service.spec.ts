import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException, BadRequestException } from '@nestjs/common';
import { ARRoomService } from '../collaboration/ar-room.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import {
  createMockPrismaService,
  createSampleProject,
  createSampleRoom,
  type ARPrismaMock,
} from './test-helpers';

describe('ARRoomService', () => {
  let service: ARRoomService;
  let prisma: ARPrismaMock;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ARRoomService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<ARRoomService>(ARRoomService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create collaboration room', async () => {
    prisma.aRProject.findUnique.mockResolvedValue(createSampleProject({ id: 'proj-1', brandId: 'brand-1' }));
    const room = createSampleRoom({
      id: 'room-new',
      projectId: 'proj-1',
      hostUserId: 'user-1',
      status: 'WAITING',
      participants: [],
      project: { id: 'proj-1', name: 'Project' },
    });
    prisma.aRCollaborationRoom.create.mockResolvedValue(room);

    const result = await service.createRoom('proj-1', 'user-1', { name: 'My Room', maxParticipants: 8 });

    expect(result.id).toBe('room-new');
    expect(prisma.aRCollaborationRoom.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        projectId: 'proj-1',
        hostUserId: 'user-1',
        status: 'WAITING',
        maxParticipants: 8,
        name: 'My Room',
      }),
      include: expect.any(Object),
    });
  });

  it('should throw NotFoundException when project not found on create', async () => {
    prisma.aRProject.findUnique.mockResolvedValue(null);
    await expect(service.createRoom('proj-missing', 'user-1')).rejects.toThrow(NotFoundException);
    await expect(service.createRoom('proj-missing', 'user-1')).rejects.toThrow(/Project.*not found/);
  });

  it('should allow joining rooms', async () => {
    const room = createSampleRoom({ id: 'room-1', status: 'ACTIVE', maxParticipants: 10, participants: [] });
    prisma.aRCollaborationRoom.findUnique.mockResolvedValue(room);
    prisma.aRRoomParticipant.create.mockResolvedValue({
      id: 'p1',
      roomId: 'room-1',
      userId: 'user-2',
      platform: 'ios',
      role: 'viewer',
      joinedAt: new Date(),
      leftAt: null,
      lastPingAt: null,
    });
    prisma.aRCollaborationRoom.update.mockResolvedValue(room);
    const roomWithDetails = { ...room, project: { id: 'proj-1', name: 'P' }, participants: [] };
    prisma.aRCollaborationRoom.findUnique.mockResolvedValue(roomWithDetails);

    const result = await service.joinRoom('room-1', 'user-2', 'ios', 'viewer');

    expect(result).toBeDefined();
    expect(prisma.aRRoomParticipant.create).toHaveBeenCalledWith({
      data: { roomId: 'room-1', userId: 'user-2', platform: 'ios', role: 'viewer' },
    });
  });

  it('should track participants', async () => {
    const participants = [
      { id: 'p1', userId: 'user-1', leftAt: null },
      { id: 'p2', userId: 'user-2', leftAt: null },
    ];
    const room = createSampleRoom({ id: 'room-1', participants, project: { id: 'proj-1', name: 'P' } });
    prisma.aRCollaborationRoom.findUnique.mockResolvedValue(room);

    const result = await service.getRoomDetails('room-1');
    expect(result).toBeDefined();
    expect(result.participants).toHaveLength(2);
  });

  it('should end rooms properly', async () => {
    const room = createSampleRoom({ id: 'room-1', hostUserId: 'user-1', status: 'ACTIVE' });
    const roomEnded = createSampleRoom({
      id: 'room-1',
      status: 'ENDED',
      endedAt: new Date(),
      project: { id: 'proj-1', name: 'P' },
      participants: [],
    });
    prisma.aRCollaborationRoom.findUnique
      .mockResolvedValueOnce(room)
      .mockResolvedValueOnce(roomEnded);
    prisma.aRCollaborationRoom.update.mockResolvedValue(roomEnded);
    prisma.aRRoomParticipant.updateMany.mockResolvedValue({ count: 2 });

    const result = await service.endRoom('room-1', 'user-1');

    expect(result.status).toBe('ENDED');
    expect(prisma.aRCollaborationRoom.update).toHaveBeenCalledWith({
      where: { id: 'room-1' },
      data: { status: 'ENDED', endedAt: expect.any(Date) },
    });
  });

  it('should enforce max participants', async () => {
    const participants = [
      { id: 'p1', userId: 'u1', leftAt: null },
      { id: 'p2', userId: 'u2', leftAt: null },
    ];
    const room = createSampleRoom({ id: 'room-1', maxParticipants: 2, participants });
    prisma.aRCollaborationRoom.findUnique.mockResolvedValue(room);

    await expect(service.joinRoom('room-1', 'user-3', 'android')).rejects.toThrow(BadRequestException);
    await expect(service.joinRoom('room-1', 'user-3', 'android')).rejects.toThrow(/Room is full|full/i);
  });

  it('should throw when joining ended room', async () => {
    const room = createSampleRoom({ id: 'room-1', status: 'ENDED', participants: [] });
    prisma.aRCollaborationRoom.findUnique.mockResolvedValue(room);

    await expect(service.joinRoom('room-1', 'user-2', 'ios')).rejects.toThrow(BadRequestException);
    await expect(service.joinRoom('room-1', 'user-2', 'ios')).rejects.toThrow(/Room has ended|ended/i);
  });

  it('should throw ForbiddenException when non-host ends room', async () => {
    const room = createSampleRoom({ id: 'room-1', hostUserId: 'host-1', status: 'ACTIVE', participants: [] });
    prisma.aRCollaborationRoom.findUnique.mockResolvedValue(room);

    await expect(service.endRoom('room-1', 'other-user')).rejects.toThrow(ForbiddenException);
    await expect(service.endRoom('room-1', 'other-user')).rejects.toThrow(/Only the host|host/);
  });
});
