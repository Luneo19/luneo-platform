import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, BadRequestException } from '@nestjs/common';
import { ProductARConfigService } from '../ecommerce/product-ar-config.service';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { createMockPrismaService, createSampleModel, type ARPrismaMock } from './test-helpers';

describe('ProductARConfigService', () => {
  let service: ProductARConfigService;
  let prisma: ARPrismaMock;

  const sampleConfig = {
    id: 'config-1',
    productId: 'prod-1',
    primaryModelId: 'model-1',
    defaultScale: 1,
    placementMode: 'GROUND_PLANE',
    showPriceInAR: true,
    showBuyButton: true,
    impressions: 0,
    arLaunches: 0,
    conversions: 0,
    product: { id: 'prod-1', name: 'Product', brandId: 'brand-1' },
    primaryModel: { id: 'model-1', name: 'Model', gltfURL: 'https://cdn.example.com/m.glb' },
  };

  beforeEach(async () => {
    prisma = createMockPrismaService();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ProductARConfigService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();
    service = module.get<ProductARConfigService>(ProductARConfigService);
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('should create product AR config', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'prod-1', brandId: 'brand-1' });
    prisma.productARConfig.findUnique.mockResolvedValue(null);
    prisma.aR3DModel.findUnique.mockResolvedValue(createSampleModel({ id: 'model-1' }));
    prisma.productARConfig.create.mockResolvedValue(sampleConfig);

    const result = await service.createConfig('prod-1', 'model-1', {
      defaultScale: 1.2,
      placementMode: 'GROUND_PLANE',
      showPriceInAR: true,
    });

    expect(result.productId).toBe('prod-1');
    expect(result.primaryModelId).toBe('model-1');
    expect(prisma.productARConfig.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        productId: 'prod-1',
        primaryModelId: 'model-1',
        defaultScale: 1.2,
        placementMode: 'GROUND_PLANE',
      }),
      include: expect.any(Object),
    });
  });

  it('should link product to model', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'prod-1', brandId: 'brand-1' });
    prisma.productARConfig.findUnique.mockResolvedValue(null);
    prisma.aR3DModel.findUnique.mockResolvedValue(createSampleModel({ id: 'model-1', name: 'Shoe 3D' }));
    prisma.productARConfig.create.mockResolvedValue({
      ...sampleConfig,
      primaryModel: { id: 'model-1', name: 'Shoe 3D', gltfURL: 'https://cdn.example.com/shoe.glb' },
    });

    const result = await service.createConfig('prod-1', 'model-1');
    expect(result.primaryModel.id).toBe('model-1');
  });

  it('should handle variant mappings via update', async () => {
    prisma.productARConfig.findUnique.mockResolvedValue(sampleConfig);
    prisma.aR3DModel.findUnique.mockResolvedValue(createSampleModel({ id: 'model-2' }));
    prisma.productARConfig.update.mockResolvedValue({
      ...sampleConfig,
      primaryModelId: 'model-2',
      primaryModel: { id: 'model-2', name: 'Variant B', gltfURL: 'https://cdn.example.com/b.glb' },
    });

    const result = await service.updateConfig('prod-1', { primaryModelId: 'model-2' });
    expect(result.primaryModelId).toBe('model-2');
  });

  it('should increment counters', async () => {
    prisma.productARConfig.findUnique.mockResolvedValue({ ...sampleConfig, impressions: 10, arLaunches: 2, conversions: 1 });
    prisma.productARConfig.update.mockResolvedValue({
      ...sampleConfig,
      impressions: 11,
      arLaunches: 2,
      conversions: 1,
    });

    await service.incrementCounter('prod-1', 'impressions', 1);
    expect(prisma.productARConfig.update).toHaveBeenCalledWith({
      where: { productId: 'prod-1' },
      data: { impressions: { increment: 1 } },
    });
  });

  it('should throw NotFoundException when product not found on create', async () => {
    prisma.product.findUnique.mockResolvedValue(null);
    await expect(service.createConfig('prod-missing', 'model-1')).rejects.toThrow(NotFoundException);
    await expect(service.createConfig('prod-missing', 'model-1')).rejects.toThrow(/Product.*not found/);
  });

  it('should throw BadRequestException when product already has AR config', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'prod-1', brandId: 'brand-1' });
    prisma.productARConfig.findUnique.mockResolvedValue(sampleConfig);
    await expect(service.createConfig('prod-1', 'model-1')).rejects.toThrow(BadRequestException);
    await expect(service.createConfig('prod-1', 'model-1')).rejects.toThrow(/already has an AR config/);
  });

  it('should throw NotFoundException when AR model not found on create', async () => {
    prisma.product.findUnique.mockResolvedValue({ id: 'prod-1', brandId: 'brand-1' });
    prisma.productARConfig.findUnique.mockResolvedValue(null);
    prisma.aR3DModel.findUnique.mockResolvedValue(null);
    await expect(service.createConfig('prod-1', 'model-missing')).rejects.toThrow(NotFoundException);
    await expect(service.createConfig('prod-1', 'model-missing')).rejects.toThrow(/AR model.*not found/);
  });

  it('should throw NotFoundException when config not found for incrementCounter', async () => {
    prisma.productARConfig.findUnique.mockResolvedValue(null);
    await expect(service.incrementCounter('prod-1', 'impressions')).rejects.toThrow(NotFoundException);
  });
});
