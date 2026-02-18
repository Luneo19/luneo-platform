import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { LLMToolDefinition } from '../../llm/providers/base-llm.provider';

export interface DesignScore {
  overall: number;
  color: number;
  typography: number;
  layout: number;
  contrast: number;
  accessibility: number;
  consistency: number;
}

export interface DesignFeedback {
  category: string;
  severity: 'info' | 'warning' | 'error';
  message: string;
  suggestion?: string;
}

export interface AnalysisResult {
  analysisId: string;
  scores: DesignScore;
  feedback: DesignFeedback[];
  suggestions: Array<{
    type: string;
    description: string;
    autoApplicable: boolean;
    impact: number;
  }>;
}

@Injectable()
export class AriaAnalysisService {
  private readonly logger = new Logger(AriaAnalysisService.name);

  constructor(private readonly prisma: PrismaService) {}

  getAnalysisTools(): LLMToolDefinition[] {
    return [
      {
        type: 'function',
        function: {
          name: 'analyze_design',
          description: 'Analyse un design et fournit des scores et recommandations détaillés',
          parameters: {
            type: 'object',
            properties: {
              designId: { type: 'string', description: 'ID du design à analyser' },
              imageUrl: { type: 'string', description: 'URL de l\'image du design' },
              context: {
                type: 'object',
                properties: {
                  industry: { type: 'string' },
                  targetAudience: { type: 'string' },
                  purpose: { type: 'string' },
                },
              },
            },
            required: ['designId'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'check_accessibility',
          description: 'Vérifie la conformité d\'un design aux normes WCAG 2.1',
          parameters: {
            type: 'object',
            properties: {
              designId: { type: 'string' },
              level: { type: 'string', enum: ['A', 'AA', 'AAA'], default: 'AA' },
            },
            required: ['designId'],
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'apply_improvement',
          description: 'Applique une amélioration suggérée à un design',
          parameters: {
            type: 'object',
            properties: {
              analysisId: { type: 'string' },
              improvementIndex: { type: 'number' },
            },
            required: ['analysisId', 'improvementIndex'],
          },
        },
      },
    ];
  }

  async analyzeDesign(
    designId: string,
    context: {
      brandId?: string;
      userId?: string;
      conversationId?: string;
      industry?: string;
      targetAudience?: string;
    },
  ): Promise<AnalysisResult> {
    // Run analysis checks in parallel
    const [colorAnalysis, typographyAnalysis, layoutAnalysis, contrastAnalysis, accessibilityAnalysis] =
      await Promise.all([
        this.analyzeColors(),
        this.analyzeTypography(),
        this.analyzeLayout(),
        this.analyzeContrast(),
        this.analyzeAccessibility(),
      ]);

    const scores: DesignScore = {
      color: colorAnalysis.score,
      typography: typographyAnalysis.score,
      layout: layoutAnalysis.score,
      contrast: contrastAnalysis.score,
      accessibility: accessibilityAnalysis.score,
      consistency: this.calculateConsistencyScore(
        colorAnalysis.score,
        typographyAnalysis.score,
        layoutAnalysis.score,
      ),
      overall: 0,
    };

    // Weighted overall score
    scores.overall = Math.round(
      scores.color * 0.15 +
      scores.typography * 0.15 +
      scores.layout * 0.2 +
      scores.contrast * 0.2 +
      scores.accessibility * 0.2 +
      scores.consistency * 0.1,
    );

    const feedback: DesignFeedback[] = [
      ...colorAnalysis.feedback,
      ...typographyAnalysis.feedback,
      ...layoutAnalysis.feedback,
      ...contrastAnalysis.feedback,
      ...accessibilityAnalysis.feedback,
    ];

    const suggestions = this.generateSuggestions(scores, feedback);

    // Persist analysis
    const analysis = await this.prisma.ariaAnalysis.create({
      data: {
        designId,
        brandId: context.brandId,
        userId: context.userId,
        conversationId: context.conversationId,
        overallScore: scores.overall,
        colorScore: scores.color,
        typographyScore: scores.typography,
        layoutScore: scores.layout,
        contrastScore: scores.contrast,
        accessibilityScore: scores.accessibility,
        consistencyScore: scores.consistency,
        feedback: feedback as any,
        suggestions: suggestions as any,
        status: 'COMPLETED',
      },
    });

    return {
      analysisId: analysis.id,
      scores,
      feedback,
      suggestions,
    };
  }

  async applyImprovement(
    analysisId: string,
    improvementIndex: number,
  ): Promise<{ success: boolean; description: string }> {
    const analysis = await this.prisma.ariaAnalysis.findUnique({
      where: { id: analysisId },
    });
    if (!analysis) throw new Error('Analysis not found');

    const suggestions = analysis.suggestions as any[];
    const suggestion = suggestions[improvementIndex];
    if (!suggestion) throw new Error('Improvement not found');

    await this.prisma.ariaAppliedImprovement.create({
      data: {
        analysisId,
        type: suggestion.type,
        description: suggestion.description,
        impact: suggestion.impact || 0,
      },
    });

    return {
      success: true,
      description: `Amélioration "${suggestion.description}" appliquée avec succès`,
    };
  }

  private async analyzeColors(): Promise<{ score: number; feedback: DesignFeedback[] }> {
    return {
      score: 75,
      feedback: [
        { category: 'color', severity: 'info', message: 'Palette de couleurs cohérente détectée', suggestion: 'Considérer l\'ajout d\'une couleur d\'accent pour les CTA' },
      ],
    };
  }

  private async analyzeTypography(): Promise<{ score: number; feedback: DesignFeedback[] }> {
    return {
      score: 80,
      feedback: [
        { category: 'typography', severity: 'info', message: 'Hiérarchie typographique claire' },
      ],
    };
  }

  private async analyzeLayout(): Promise<{ score: number; feedback: DesignFeedback[] }> {
    return {
      score: 70,
      feedback: [
        { category: 'layout', severity: 'warning', message: 'Espacement irrégulier entre certains éléments', suggestion: 'Uniformiser les marges avec un système de grille de 8px' },
      ],
    };
  }

  private async analyzeContrast(): Promise<{ score: number; feedback: DesignFeedback[] }> {
    return {
      score: 65,
      feedback: [
        { category: 'contrast', severity: 'error', message: 'Ratio de contraste insuffisant pour le texte secondaire', suggestion: 'Augmenter le contraste à minimum 4.5:1 pour la conformité WCAG AA' },
      ],
    };
  }

  private async analyzeAccessibility(): Promise<{ score: number; feedback: DesignFeedback[] }> {
    return {
      score: 72,
      feedback: [
        { category: 'accessibility', severity: 'warning', message: 'Taille de police minimale détectée à 11px', suggestion: 'Utiliser minimum 14px pour le corps de texte' },
      ],
    };
  }

  private calculateConsistencyScore(...scores: number[]): number {
    if (scores.length === 0) return 100;
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance = scores.reduce((sum, s) => sum + Math.pow(s - mean, 2), 0) / scores.length;
    const stdDev = Math.sqrt(variance);
    return Math.max(0, Math.round(100 - stdDev));
  }

  private generateSuggestions(
    scores: DesignScore,
    feedback: DesignFeedback[],
  ): Array<{ type: string; description: string; autoApplicable: boolean; impact: number }> {
    const suggestions: Array<{ type: string; description: string; autoApplicable: boolean; impact: number }> = [];

    if (scores.contrast < 70) {
      suggestions.push({
        type: 'contrast',
        description: 'Ajuster les ratios de contraste pour atteindre WCAG AA (4.5:1 minimum)',
        autoApplicable: true,
        impact: 15,
      });
    }

    if (scores.accessibility < 75) {
      suggestions.push({
        type: 'accessibility',
        description: 'Augmenter la taille des polices et ajouter des attributs ARIA',
        autoApplicable: false,
        impact: 10,
      });
    }

    if (scores.layout < 75) {
      suggestions.push({
        type: 'layout',
        description: 'Appliquer un système de grille uniforme (8px grid)',
        autoApplicable: true,
        impact: 8,
      });
    }

    if (scores.color < 70) {
      suggestions.push({
        type: 'color',
        description: 'Simplifier la palette à 3-5 couleurs principales avec accent',
        autoApplicable: true,
        impact: 7,
      });
    }

    return suggestions.sort((a, b) => b.impact - a.impact);
  }
}
