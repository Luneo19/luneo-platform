import { Test, TestingModule } from '@nestjs/testing';
import { AriaAnalysisService } from '../../aria/services/aria-analysis.service';
import { PrismaService } from '@/libs/prisma/prisma.service';

describe('AriaAnalysisService', () => {
  let service: AriaAnalysisService;

  const mockPrisma = {
    ariaAnalysis: {
      create: jest.fn(),
      findUnique: jest.fn(),
    },
    ariaAppliedImprovement: {
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AriaAnalysisService,
        { provide: PrismaService, useValue: mockPrisma },
      ],
    }).compile();

    service = module.get<AriaAnalysisService>(AriaAnalysisService);
    jest.clearAllMocks();
  });

  describe('getAnalysisTools', () => {
    it('should return 3 analysis tool definitions', () => {
      const tools = service.getAnalysisTools();
      expect(tools).toHaveLength(3);
    });

    it('should include analyze_design tool', () => {
      const tools = service.getAnalysisTools();
      const tool = tools.find((t) => t.function.name === 'analyze_design');
      expect(tool).toBeDefined();
      expect(tool!.function.parameters.required).toContain('designId');
    });

    it('should include check_accessibility tool with WCAG levels', () => {
      const tools = service.getAnalysisTools();
      const tool = tools.find((t) => t.function.name === 'check_accessibility');
      expect(tool).toBeDefined();
      const props = tool!.function.parameters.properties as Record<string, any>;
      const levelEnum = props.level.enum;
      expect(levelEnum).toEqual(['A', 'AA', 'AAA']);
    });

    it('should include apply_improvement tool', () => {
      const tools = service.getAnalysisTools();
      const tool = tools.find((t) => t.function.name === 'apply_improvement');
      expect(tool).toBeDefined();
      expect(tool!.function.parameters.required).toContain('analysisId');
      expect(tool!.function.parameters.required).toContain('improvementIndex');
    });
  });

  describe('analyzeDesign', () => {
    const mockAnalysis = { id: 'analysis-1' };
    const context = { brandId: 'brand-1', userId: 'user-1', conversationId: 'conv-1' };

    beforeEach(() => {
      mockPrisma.ariaAnalysis.create.mockResolvedValue(mockAnalysis as any);
    });

    it('should return analysis with all score dimensions', async () => {
      const result = await service.analyzeDesign('design-1', context);

      expect(result.analysisId).toBe('analysis-1');
      expect(result.scores).toHaveProperty('overall');
      expect(result.scores).toHaveProperty('color');
      expect(result.scores).toHaveProperty('typography');
      expect(result.scores).toHaveProperty('layout');
      expect(result.scores).toHaveProperty('contrast');
      expect(result.scores).toHaveProperty('accessibility');
      expect(result.scores).toHaveProperty('consistency');
    });

    it('should return scores between 0 and 100', async () => {
      const result = await service.analyzeDesign('design-1', context);
      for (const [, value] of Object.entries(result.scores)) {
        expect(value).toBeGreaterThanOrEqual(0);
        expect(value).toBeLessThanOrEqual(100);
      }
    });

    it('should calculate overall score as weighted average', async () => {
      const result = await service.analyzeDesign('design-1', context);
      const s = result.scores;
      const expected = Math.round(
        s.color * 0.15 +
        s.typography * 0.15 +
        s.layout * 0.2 +
        s.contrast * 0.2 +
        s.accessibility * 0.2 +
        s.consistency * 0.1,
      );
      expect(s.overall).toBe(expected);
    });

    it('should return feedback items with valid severities', async () => {
      const result = await service.analyzeDesign('design-1', context);
      expect(result.feedback.length).toBeGreaterThan(0);
      for (const fb of result.feedback) {
        expect(fb).toHaveProperty('category');
        expect(fb).toHaveProperty('severity');
        expect(fb).toHaveProperty('message');
        expect(['info', 'warning', 'error']).toContain(fb.severity);
      }
    });

    it('should generate suggestions sorted by impact descending', async () => {
      const result = await service.analyzeDesign('design-1', context);
      expect(result.suggestions.length).toBeGreaterThan(0);
      for (let i = 1; i < result.suggestions.length; i++) {
        expect(result.suggestions[i - 1].impact).toBeGreaterThanOrEqual(result.suggestions[i].impact);
      }
    });

    it('should persist analysis to database with all scores', async () => {
      await service.analyzeDesign('design-1', context);
      expect(mockPrisma.ariaAnalysis.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          designId: 'design-1',
          brandId: 'brand-1',
          userId: 'user-1',
          status: 'COMPLETED',
          overallScore: expect.any(Number),
          colorScore: expect.any(Number),
          typographyScore: expect.any(Number),
          layoutScore: expect.any(Number),
          contrastScore: expect.any(Number),
          accessibilityScore: expect.any(Number),
          consistencyScore: expect.any(Number),
        }),
      });
    });
  });

  describe('applyImprovement', () => {
    it('should apply an existing improvement', async () => {
      const mockAnalysis = {
        id: 'analysis-1',
        suggestions: [
          { type: 'contrast', description: 'Fix contrast', impact: 15 },
          { type: 'layout', description: 'Fix layout', impact: 8 },
        ],
      };
      mockPrisma.ariaAnalysis.findUnique.mockResolvedValue(mockAnalysis as any);
      mockPrisma.ariaAppliedImprovement.create.mockResolvedValue({} as any);

      const result = await service.applyImprovement('analysis-1', 0);
      expect(result.success).toBe(true);
      expect(result.description).toContain('Fix contrast');
    });

    it('should throw if analysis not found', async () => {
      mockPrisma.ariaAnalysis.findUnique.mockResolvedValue(null);
      await expect(service.applyImprovement('nonexistent', 0)).rejects.toThrow('Analysis not found');
    });

    it('should throw if improvement index out of bounds', async () => {
      const mockAnalysis = { id: 'a-1', suggestions: [{ type: 'x', description: 'y' }] };
      mockPrisma.ariaAnalysis.findUnique.mockResolvedValue(mockAnalysis as any);
      await expect(service.applyImprovement('a-1', 99)).rejects.toThrow('Improvement not found');
    });

    it('should persist applied improvement with correct data', async () => {
      const mockAnalysis = {
        id: 'analysis-1',
        suggestions: [{ type: 'contrast', description: 'Fix contrast', impact: 15 }],
      };
      mockPrisma.ariaAnalysis.findUnique.mockResolvedValue(mockAnalysis as any);
      mockPrisma.ariaAppliedImprovement.create.mockResolvedValue({} as any);

      await service.applyImprovement('analysis-1', 0);
      expect(mockPrisma.ariaAppliedImprovement.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          analysisId: 'analysis-1',
          type: 'contrast',
          description: 'Fix contrast',
          impact: 15,
        }),
      });
    });
  });
});
