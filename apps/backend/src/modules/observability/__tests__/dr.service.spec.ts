/**
 * DRService unit tests (backup/restore - mocked fs and exec)
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DRService } from '../services/dr.service';
import { PrismaService } from '@/libs/prisma/prisma.service';

describe('DRService', () => {
  let service: DRService;
  let prisma: PrismaService;

  const mockPrisma = {
    backupRecord: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
      count: jest.fn(),
    },
    restoreDrillRecord: {
      create: jest.fn(),
      update: jest.fn(),
      findFirst: jest.fn(),
      count: jest.fn(),
    },
  };

  const mockConfigService = {
    get: jest.fn().mockImplementation((key: string) => {
      const map: Record<string, string | undefined> = {
        BACKUP_S3_BUCKET: '',
        BACKUP_STORAGE_PATH: undefined,
        DATABASE_URL: 'postgres://local',
        UPLOAD_PATH: undefined,
      };
      return map[key];
    }),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockConfigService.get.mockImplementation((key: string) => {
      const map: Record<string, string | undefined> = {
        BACKUP_S3_BUCKET: '',
        BACKUP_STORAGE_PATH: undefined,
        DATABASE_URL: 'postgres://local',
        UPLOAD_PATH: undefined,
      };
      return map[key];
    });
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DRService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<DRService>(DRService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('listBackups', () => {
    it('should return backups from Prisma', async () => {
      const rows = [
        {
          id: 'backup_1',
          type: 'database',
          status: 'completed',
          size: 1024,
          location: 's3://bucket/backup.dump.gz',
          createdAt: new Date(),
          completedAt: new Date(),
          error: null,
        },
      ];
      mockPrisma.backupRecord.findMany.mockResolvedValue(rows);

      const result = await service.listBackups(undefined, 50);

      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('backup_1');
      expect(result[0].status).toBe('completed');
      expect(mockPrisma.backupRecord.findMany).toHaveBeenCalledWith({
        where: undefined,
        orderBy: { createdAt: 'desc' },
        take: 50,
      });
    });

    it('should filter by type when provided', async () => {
      mockPrisma.backupRecord.findMany.mockResolvedValue([]);

      await service.listBackups('storage', 10);

      expect(mockPrisma.backupRecord.findMany).toHaveBeenCalledWith({
        where: { type: 'storage' },
        orderBy: { createdAt: 'desc' },
        take: 10,
      });
    });
  });

  describe('cleanupOldBackups', () => {
    it('should delete backups older than retention days', async () => {
      mockPrisma.backupRecord.deleteMany.mockResolvedValue({ count: 3 });

      const result = await service.cleanupOldBackups(30);

      expect(result).toBe(3);
      expect(mockPrisma.backupRecord.deleteMany).toHaveBeenCalledWith({
        where: { createdAt: { lt: expect.any(Date) } },
      });
    });
  });

  describe('verifyBackup', () => {
    it('should return false when backup not found', async () => {
      mockPrisma.backupRecord.findUnique.mockResolvedValue(null);

      const result = await service.verifyBackup('missing');

      expect(result).toBe(false);
    });

    it('should return false when backup status not completed', async () => {
      mockPrisma.backupRecord.findUnique.mockResolvedValue({
        id: 'b1',
        status: 'failed',
        location: null,
      });

      const result = await service.verifyBackup('b1');

      expect(result).toBe(false);
    });

    it('should return true for completed simulated backup', async () => {
      mockPrisma.backupRecord.findUnique.mockResolvedValue({
        id: 'b1',
        status: 'completed',
        location: 'simulated://b1.dump.gz',
      });

      const result = await service.verifyBackup('b1');

      expect(result).toBe(true);
    });
  });

  describe('runRestoreDrill', () => {
    it('should throw NotFoundException when backup not in list', async () => {
      mockPrisma.backupRecord.findMany.mockResolvedValue([
        { id: 'other', type: 'database', status: 'completed', size: 0, location: '', createdAt: new Date(), completedAt: null, error: null },
      ]);

      await expect(service.runRestoreDrill('missing-backup')).rejects.toThrow(NotFoundException);
      await expect(service.runRestoreDrill('missing-backup')).rejects.toThrow(/Backup .* not found/);
    });
  });

  describe('generateDRReport', () => {
    it('should return report with lastBackup, backupCount, rto, rpo', async () => {
      mockPrisma.backupRecord.findMany.mockResolvedValue([
        { id: 'b1', createdAt: new Date(), completedAt: new Date(), status: 'completed', size: 0, location: '', error: null },
      ]);
      mockPrisma.backupRecord.findFirst.mockResolvedValue({ id: 'old', createdAt: new Date(Date.now() - 86400000 * 10), completedAt: null, status: 'completed', size: 0, location: '', error: null });
      mockPrisma.backupRecord.count.mockResolvedValue(5);
      mockPrisma.restoreDrillRecord.count.mockResolvedValue(2);
      mockPrisma.restoreDrillRecord.findFirst.mockResolvedValue({ startedAt: new Date() });

      const result = await service.generateDRReport();

      expect(result).toHaveProperty('lastBackup');
      expect(result).toHaveProperty('backupCount');
      expect(result).toHaveProperty('oldestBackup');
      expect(result).toHaveProperty('restoreDrills');
      expect(result).toHaveProperty('lastDrill');
      expect(result).toHaveProperty('rto');
      expect(result).toHaveProperty('rpo');
      expect(result.rto).toBe(60);
      expect(result.rpo).toBe(1440);
    });
  });
});
