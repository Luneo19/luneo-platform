import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogService, AuditAction } from '../services/audit-log.service';
import { PrismaService } from '@/libs/prisma/prisma.service';

describe('AuditLogService', () => {
  let service: AuditLogService;

  const mockPrisma = {
    auditLog: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuditLogService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('log', () => {
    it('should create audit log when userId is provided', async () => {
      mockPrisma.auditLog.create.mockResolvedValue({ id: 'log-1' });
      const data = {
        userId: 'user-1',
        action: AuditAction.USER_LOGIN,
        success: true,
      };
      await service.log(data);
      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          eventType: AuditAction.USER_LOGIN,
          userId: 'user-1',
          action: AuditAction.USER_LOGIN,
          success: true,
          resourceType: 'unknown',
          resourceId: 'unknown',
        }),
      });
    });

    it('should not create audit log when userId is missing', async () => {
      await service.log({
        action: AuditAction.USER_LOGIN,
        success: true,
      } as any);
      expect(mockPrisma.auditLog.create).not.toHaveBeenCalled();
    });

    it('should not throw when create fails (audit is non-blocking)', async () => {
      mockPrisma.auditLog.create.mockRejectedValue(new Error('DB error'));
      await expect(
        service.log({
          userId: 'user-1',
          action: AuditAction.ORDER_CREATED,
          success: true,
        }),
      ).resolves.not.toThrow();
    });
  });

  describe('getAuditLogs', () => {
    it('should return logs with filters', async () => {
      const mockLogs = [
        { id: '1', userId: 'user-1', action: AuditAction.USER_LOGIN },
      ];
      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs);
      const result = await service.getAuditLogs({
        userId: 'user-1',
        limit: 10,
        offset: 0,
      });
      expect(result).toEqual(mockLogs);
      expect(mockPrisma.auditLog.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { userId: 'user-1' },
          take: 10,
          skip: 0,
          orderBy: { timestamp: 'desc' },
        }),
      );
    });

    it('should return empty array on error', async () => {
      mockPrisma.auditLog.findMany.mockRejectedValue(new Error('DB error'));
      const result = await service.getAuditLogs({});
      expect(result).toEqual([]);
    });
  });

  describe('getAuditLogById', () => {
    it('should return log when found', async () => {
      const mockLog = { id: 'log-1', userId: 'user-1' };
      mockPrisma.auditLog.findUnique.mockResolvedValue(mockLog);
      const result = await service.getAuditLogById('log-1');
      expect(result).toEqual(mockLog);
      expect(mockPrisma.auditLog.findUnique).toHaveBeenCalledWith({
        where: { id: 'log-1' },
      });
    });

    it('should return null on error', async () => {
      mockPrisma.auditLog.findUnique.mockRejectedValue(new Error('DB error'));
      const result = await service.getAuditLogById('log-1');
      expect(result).toBeNull();
    });
  });

  describe('exportAuditLogs', () => {
    it('should return JSON buffer when format is json', async () => {
      const mockLogs = [{ id: '1', eventType: 'USER_LOGIN' }];
      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs);
      const result = await service.exportAuditLogs({}, 'json');
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(JSON.parse(result.toString())).toEqual(mockLogs);
    });

    it('should return CSV buffer when format is csv', async () => {
      const mockLogs = [
        {
          id: '1',
          eventType: 'USER_LOGIN',
          userId: 'u1',
          resourceType: 'user',
          resourceId: 'u1',
          action: 'USER_LOGIN',
          success: true,
          ipAddress: null,
          userAgent: null,
          timestamp: new Date('2024-01-01'),
        },
      ];
      mockPrisma.auditLog.findMany.mockResolvedValue(mockLogs);
      const result = await service.exportAuditLogs({}, 'csv');
      expect(Buffer.isBuffer(result)).toBe(true);
      expect(result.toString()).toContain('ID');
      expect(result.toString()).toContain('USER_LOGIN');
    });
  });
});
