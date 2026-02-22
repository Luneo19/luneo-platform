import { Test, TestingModule } from '@nestjs/testing';
import { LunaDesignService } from '../../luna/services/luna-design.service';
import { PrismaService } from '@/libs/prisma/prisma.service';

describe('LunaDesignService', () => {
  let service: LunaDesignService;

  const mockPrisma = {
    lunaGeneration: {
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LunaDesignService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<LunaDesignService>(LunaDesignService);
    jest.clearAllMocks();
  });

  describe('getDesignTools', () => {
    it('should return 3 tool definitions', () => {
      const tools = service.getDesignTools();
      expect(tools).toHaveLength(3);
    });

    it('should include generate_design tool', () => {
      const tools = service.getDesignTools();
      const designTool = tools.find((t) => t.function.name === 'generate_design');
      expect(designTool).toBeDefined();
      expect(designTool!.type).toBe('function');
      expect(designTool!.function.parameters.required).toContain('type');
      expect(designTool!.function.parameters.required).toContain('prompt');
    });

    it('should include generate_color_palette tool', () => {
      const tools = service.getDesignTools();
      const paletteTool = tools.find((t) => t.function.name === 'generate_color_palette');
      expect(paletteTool).toBeDefined();
      expect(paletteTool!.function.parameters.required).toContain('theme');
    });

    it('should include suggest_improvements tool', () => {
      const tools = service.getDesignTools();
      const improveTool = tools.find((t) => t.function.name === 'suggest_improvements');
      expect(improveTool).toBeDefined();
      expect(improveTool!.function.parameters.required).toContain('designId');
    });

    it('should have valid enum values for design types', () => {
      const tools = service.getDesignTools();
      const designTool = tools.find((t) => t.function.name === 'generate_design');
      const props = designTool!.function.parameters.properties as Record<string, unknown>;
      const typeEnum = props.type.enum;
      expect(typeEnum).toContain('logo');
      expect(typeEnum).toContain('banner');
      expect(typeEnum).toContain('social_post');
      expect(typeEnum).toContain('product_image');
      expect(typeEnum).toContain('flyer');
    });
  });

  describe('executeDesignTool', () => {
    const mockGeneration = { id: 'gen-123', type: 'logo', prompt: '{}', status: 'PROCESSING' };
    const context = { brandId: 'brand-1', userId: 'user-1', conversationId: 'conv-1' };

    beforeEach(() => {
      mockPrisma.lunaGeneration.create.mockResolvedValue(mockGeneration);
      mockPrisma.lunaGeneration.update.mockResolvedValue({ ...mockGeneration, status: 'COMPLETED' });
    });

    it('should create a generation record and process generate_design', async () => {
      const args = { type: 'logo', prompt: 'Modern tech logo', style: 'minimal' };
      const result = await service.executeDesignTool('generate_design', args, context);

      expect(mockPrisma.lunaGeneration.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          type: 'logo',
          brandId: 'brand-1',
          userId: 'user-1',
          status: 'PROCESSING',
        }),
      });
      expect(result.generationId).toBe('gen-123');
      expect(result.status).toBe('COMPLETED');
      expect(result.result).toBeDefined();
    });

    it('should handle generate_color_palette tool', async () => {
      const args = { theme: 'warm', count: 3 };
      const result = await service.executeDesignTool('generate_color_palette', args, context);

      expect(result.status).toBe('COMPLETED');
      expect(result.result).toHaveProperty('theme', 'warm');
      expect((result.result as unknown).colors).toHaveLength(3);
    });

    it('should return 5 colors by default for color palette', async () => {
      const args = { theme: 'vibrant' };
      const result = await service.executeDesignTool('generate_color_palette', args, context);
      expect((result.result as unknown).colors).toHaveLength(5);
    });

    it('should handle suggest_improvements tool', async () => {
      const args = { designId: 'design-1', focusAreas: ['colors', 'typography'] };
      const result = await service.executeDesignTool('suggest_improvements', args, context);

      expect(result.status).toBe('COMPLETED');
      expect((result.result as unknown).suggestions).toBeDefined();
      expect((result.result as unknown).suggestions.length).toBeGreaterThan(0);
    });

    it('should throw error for unknown tool', async () => {
      await expect(
        service.executeDesignTool('unknown_tool', {}, context),
      ).rejects.toThrow('Unknown tool: unknown_tool');
    });

    it('should mark generation as FAILED on error', async () => {
      let failCallMade = false;
      mockPrisma.lunaGeneration.update.mockImplementation(async (args: Record<string, unknown>) => {
        if (args.data.status === 'FAILED') {
          failCallMade = true;
          return { ...mockGeneration, status: 'FAILED' };
        }
        return { ...mockGeneration, status: 'COMPLETED' };
      });

      try {
        await service.executeDesignTool('invalid_tool', {}, context);
      } catch {
        // expected
      }

      expect(failCallMade).toBe(true);
    });

    it('should support all palette themes', async () => {
      for (const theme of ['warm', 'cool', 'pastel', 'vibrant', 'earthy']) {
        mockPrisma.lunaGeneration.create.mockResolvedValue(mockGeneration);
        mockPrisma.lunaGeneration.update.mockResolvedValue({ ...mockGeneration, status: 'COMPLETED' });
        const result = await service.executeDesignTool('generate_color_palette', { theme }, context);
        expect((result.result as unknown).theme).toBe(theme);
        expect((result.result as unknown).colors.length).toBeGreaterThan(0);
      }
    });

    it('should fallback to vibrant palette for unknown theme', async () => {
      const result = await service.executeDesignTool('generate_color_palette', { theme: 'unknown' }, context);
      expect((result.result as unknown).colors).toBeDefined();
      expect((result.result as unknown).colors.length).toBeGreaterThan(0);
    });
  });
});
