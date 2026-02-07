/**
 * WidgetService unit tests
 */
import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { WidgetService } from './widget.service';
import { PrismaService } from '@/libs/prisma/prisma.service';

describe('WidgetService', () => {
  let service: WidgetService;
  let prisma: PrismaService;

  const mockPrisma = {
    product: { findUnique: jest.fn() },
    design: { findUnique: jest.fn(), upsert: jest.fn() },
    designLayer: { deleteMany: jest.fn(), createMany: jest.fn() },
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [WidgetService, { provide: PrismaService, useValue: mockPrisma }],
    }).compile();
    service = module.get<WidgetService>(WidgetService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getProductConfig', () => {
    it('should return product config when product exists', async () => {
      const product = {
        id: 'prod-1',
        name: 'Test Product',
        customizationOptions: [],
        customizableAreas: [{
          id: 'area-1',
          name: 'Front',
          description: null,
          x: 0, y: 0, width: 100, height: 100,
          minWidth: null, maxWidth: null, minHeight: null, maxHeight: null,
          aspectRatio: null, allowedLayerTypes: [], maxTextLength: null,
          allowedFonts: null, defaultFont: null, allowedFontSizes: null,
          maxImageSize: null, allowedFormats: null, minImageWidth: null,
          minImageHeight: null, maxImageWidth: null, maxImageHeight: null,
          allowedShapes: null, allowedColors: null, defaultColor: null,
          isRequired: true,
        }],
      };
      mockPrisma.product.findUnique.mockResolvedValue(product);
      const result = await service.getProductConfig('prod-1');
      expect(result.productId).toBe('prod-1');
      expect(result.productName).toBe('Test Product');
      expect(result.customizableAreas).toHaveLength(1);
      expect(mockPrisma.product.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'prod-1' } }));
    });

    it('should throw NotFoundException when product not found', async () => {
      mockPrisma.product.findUnique.mockResolvedValue(null);
      await expect(service.getProductConfig('missing')).rejects.toThrow(NotFoundException);
      await expect(service.getProductConfig('missing')).rejects.toThrow('Product not found');
    });
  });

  describe('loadDesign', () => {
    it('should return design data when design exists', async () => {
      const design = {
        id: 'design-1',
        productId: 'prod-1',
        canvasWidth: 800,
        canvasHeight: 600,
        canvasBackgroundColor: '#fff',
        createdAt: new Date(),
        updatedAt: new Date(),
        layers: [{ id: 'layer-1', type: 'text', x: 10, y: 10, rotation: 0, scaleX: 1, scaleY: 1, opacity: 1, visible: true, locked: false, data: {} }],
      };
      mockPrisma.design.findUnique.mockResolvedValue(design);
      const result = await service.loadDesign('design-1');
      expect(result.id).toBe('design-1');
      expect(result.canvas.width).toBe(800);
      expect(result.layers).toHaveLength(1);
      expect(mockPrisma.design.findUnique).toHaveBeenCalledWith(expect.objectContaining({ where: { id: 'design-1' } }));
    });

    it('should throw NotFoundException when design not found', async () => {
      mockPrisma.design.findUnique.mockResolvedValue(null);
      await expect(service.loadDesign('missing')).rejects.toThrow(NotFoundException);
      await expect(service.loadDesign('missing')).rejects.toThrow('Design not found');
    });
  });

  describe('saveDesign', () => {
    it('should save design and return designId and url', async () => {
      const designData = {
        id: 'design-1',
        productId: 'prod-1',
        canvas: { width: 800, height: 600, backgroundColor: '#fff' },
        layers: [{ id: 'l1', type: 'text', position: { x: 0, y: 0 }, rotation: 0, scale: { x: 1, y: 1 }, opacity: 1, visible: true, locked: false, data: {} }],
        metadata: { createdAt: '', updatedAt: '', name: 'My Design' },
      };
      mockPrisma.product.findUnique.mockResolvedValue({ brandId: 'brand-1' });
      mockPrisma.design.upsert.mockResolvedValue({ id: 'design-1' });
      mockPrisma.designLayer.deleteMany.mockResolvedValue({ count: 0 });
      mockPrisma.designLayer.createMany.mockResolvedValue({ count: 1 });
      const result = await service.saveDesign('prod-1', designData, 'user-1');
      expect(result).toEqual({ designId: 'design-1', url: '/designs/design-1' });
      expect(mockPrisma.design.upsert).toHaveBeenCalled();
      expect(mockPrisma.designLayer.deleteMany).toHaveBeenCalledWith({ where: { designId: 'design-1' } });
      expect(mockPrisma.designLayer.createMany).toHaveBeenCalled();
    });
  });
});
