import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException } from '@nestjs/common';
import { DynamicLinkService } from '../qr-codes/dynamic-link.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { createMockPrismaService, createSampleProject, createSampleQRCode, type ARPrismaMock } from './test-helpers';
import { QRCodeType } from '@prisma/client';

describe('DynamicLinkService', () => {
  let service: DynamicLinkService;
  let prisma: ARPrismaMock;

  beforeEach(async () => {
    prisma = createMockPrismaService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DynamicLinkService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<DynamicLinkService>(DynamicLinkService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should generate unique short codes', async () => {
    prisma.aRProject.findFirst.mockResolvedValue(createSampleProject({ id: 'proj-1', brandId: 'brand-1' }));
    prisma.aRQRCode.findUnique.mockResolvedValue(null);
    prisma.aRQRCode.create.mockResolvedValue(
      createSampleQRCode({ id: 'qr-1', shortCode: 'abc12xyz', targetURL: 'https://app.example.com/ar/1' }),
    );

    const result = await service.createShortLink({
      projectId: 'proj-1',
      brandId: 'brand-1',
      targetUrl: 'https://app.example.com/ar/view/model-1',
      type: QRCodeType.AR_VIEWER,
      name: 'AR Link',
    });

    expect(result.shortCode).toBeDefined();
    expect(result.shortCode.length).toBeGreaterThan(0);
    expect(result.qrCodeId).toBe('qr-1');
    expect(prisma.aRQRCode.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        projectId: 'proj-1',
        targetURL: 'https://app.example.com/ar/view/model-1',
        type: QRCodeType.AR_VIEWER,
        name: 'AR Link',
      }),
    });
  });

  it('should resolve short links', async () => {
    const qr = createSampleQRCode({
      id: 'qr-1',
      shortCode: 'abc12xyz',
      targetURL: 'https://app.example.com/ar/view/model-1',
    });
    prisma.aRQRCode.findUnique.mockResolvedValue({
      id: qr.id,
      targetURL: qr.targetURL,
      projectId: 'proj-1',
    });

    const result = await service.resolveShortLink('abc12xyz');

    expect(result).not.toBeNull();
    expect(result?.targetUrl).toBe('https://app.example.com/ar/view/model-1');
    expect(result?.projectId).toBe('proj-1');
    expect(result?.qrCodeId).toBe('qr-1');
  });

  it('should return null when short code not found', async () => {
    prisma.aRQRCode.findUnique.mockResolvedValue(null);
    const result = await service.resolveShortLink('nonexistent');
    expect(result).toBeNull();
  });

  it('should increment scan count', async () => {
    prisma.aRQRCode.updateMany.mockResolvedValue({ count: 1 });
    await service.incrementScanCount('abc12xyz');
    expect(prisma.aRQRCode.updateMany).toHaveBeenCalledWith({
      where: { shortCode: 'abc12xyz' },
      data: {
        scanCount: { increment: 1 },
        lastScannedAt: expect.any(Date),
      },
    });
  });

  it('should throw ForbiddenException when project not found on create', async () => {
    prisma.aRProject.findFirst.mockResolvedValue(null);
    await expect(
      service.createShortLink({
        projectId: 'proj-missing',
        brandId: 'brand-1',
        targetUrl: 'https://example.com',
        type: QRCodeType.AR_VIEWER,
        name: 'Link',
      }),
    ).rejects.toThrow(ForbiddenException);
    await expect(
      service.createShortLink({
        projectId: 'proj-missing',
        brandId: 'brand-1',
        targetUrl: 'https://example.com',
        type: QRCodeType.AR_VIEWER,
        name: 'Link',
      }),
    ).rejects.toThrow(/Project not found|access denied/i);
  });

  it('should retry when short code collision', async () => {
    prisma.aRProject.findFirst.mockResolvedValue(createSampleProject());
    prisma.aRQRCode.findUnique
      .mockResolvedValueOnce({ id: 'existing' })
      .mockResolvedValueOnce(null);
    prisma.aRQRCode.create.mockResolvedValue(
      createSampleQRCode({ id: 'qr-new', shortCode: 'unique2', targetURL: 'https://a.co' }),
    );

    const result = await service.createShortLink({
      projectId: 'proj-1',
      brandId: 'brand-1',
      targetUrl: 'https://a.co',
      type: QRCodeType.AR_VIEWER,
      name: 'Link',
    });

    expect(result.shortCode).toBeDefined();
    expect(prisma.aRQRCode.create).toHaveBeenCalled();
  });
});
