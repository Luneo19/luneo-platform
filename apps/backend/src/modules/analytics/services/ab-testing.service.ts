import { PrismaService } from '@/libs/prisma/prisma.service';
import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';

export interface Experiment {
  id: string;
  name: string;
  description: string;
  type: 'pricing' | 'copy' | 'prompt' | 'variants' | 'layout';
  variants: Array<{
    id: string;
    name: string;
    config: Record<string, unknown>;
    weight: number; // 0-100, pour distribution
  }>;
  status: 'draft' | 'running' | 'paused' | 'completed';
  startDate?: Date;
  endDate?: Date;
  targetAudience?: {
    brands?: string[];
    countries?: string[];
    userRoles?: string[];
  };
}

export interface ExperimentAssignment {
  userId: string;
  experimentId: string;
  variantId: string;
  assignedAt: Date;
}

export interface ExperimentResult {
  experimentId: string;
  variantId: string;
  participants: number;
  conversions: number;
  conversionRate: number;
  revenue?: number;
  avgOrderValue?: number;
  statisticalSignificance?: number;
  winner?: boolean;
}

@Injectable()
export class ABTestingService {
  private readonly logger = new Logger(ABTestingService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crée une expérience A/B
   */
  async createExperiment(
    brandId: string,
    experiment: Omit<Experiment, 'id' | 'status'>,
  ): Promise<Experiment> {
    try {
      this.logger.log(`Creating experiment for brand: ${brandId}`);

      // Créer l'expérience dans Prisma
      // Note: brandId n'existe pas dans le schéma Experiment, on le stocke dans targetAudience si nécessaire
      const targetAudience = experiment.targetAudience || {};
      if (brandId) {
        (targetAudience as Record<string, unknown>).brandId = brandId;
      }
      
      const created = await this.prisma.experiment.create({
        data: {
          name: experiment.name,
          description: experiment.description,
          type: experiment.type,
          variants: experiment.variants as Prisma.InputJsonValue,
          status: 'draft',
          startDate: experiment.startDate,
          endDate: experiment.endDate,
          targetAudience: targetAudience as Prisma.InputJsonValue,
        },
      });

      return {
        id: created.id,
        name: created.name,
        description: created.description,
        type: created.type as Experiment['type'],
        variants: (created.variants as Experiment['variants']) || [],
        status: created.status as Experiment['status'],
        startDate: created.startDate || undefined,
        endDate: created.endDate || undefined,
        targetAudience: (created.targetAudience as Experiment['targetAudience']) || undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to create experiment: ${error instanceof Error ? errorMessage : 'Unknown error'}`, error instanceof Error ? errorStack : undefined);
      throw error;
    }
  }

  /**
   * Démarre une expérience
   */
  async startExperiment(experimentId: string, brandId: string): Promise<Experiment> {
    try {
      this.logger.log(`Starting experiment: ${experimentId}`);

      const experiment = await this.prisma.experiment.findFirst({
        where: { id: experimentId },
      });

      if (!experiment) {
        throw new NotFoundException('Experiment not found');
      }

      // Vérifier brandId dans targetAudience si nécessaire
      const targetAudience = experiment.targetAudience as Record<string, unknown> | null;
      if (targetAudience && targetAudience.brandId && targetAudience.brandId !== brandId) {
        throw new NotFoundException('Experiment not found');
      }

      const updated = await this.prisma.experiment.update({
        where: { id: experimentId },
        data: {
          status: 'running',
          startDate: new Date(),
        },
      });

      return {
        id: updated.id,
        name: updated.name,
        description: updated.description,
        type: updated.type as Experiment['type'],
        variants: (updated.variants as Experiment['variants']) || [],
        status: updated.status as Experiment['status'],
        startDate: updated.startDate || undefined,
        endDate: updated.endDate || undefined,
        targetAudience: (updated.targetAudience as Experiment['targetAudience']) || undefined,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to start experiment: ${error instanceof Error ? errorMessage : 'Unknown error'}`, error instanceof Error ? errorStack : undefined);
      throw error;
    }
  }

  /**
   * Assigne un utilisateur à une variante
   */
  async assignVariant(userId: string, experimentId: string): Promise<string> {
    try {
      // Vérifier si déjà assigné
      const existing = await this.getAssignment(userId, experimentId);
      if (existing) {
        return existing.variantId;
      }

      // Récupérer l'expérience depuis Prisma
      const experiment = await this.prisma.experiment.findUnique({
        where: { id: experimentId },
      });

      if (!experiment || experiment.status !== 'running') {
        throw new BadRequestException('Experiment not found or not running');
      }

      const variants = (experiment.variants as Experiment['variants']) || [];

      if (variants.length === 0) {
        throw new BadRequestException('Experiment has no variants');
      }

      // Assigner selon poids (hash userId pour consistance)
      const hash = this.hashUserId(userId, experimentId);
      const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
      let cumulative = 0;
      let selectedVariant = variants[0]?.id || '';

      for (const variant of variants) {
        cumulative += variant.weight;
        if (hash < (cumulative / totalWeight) * 100) {
          selectedVariant = variant.id;
          break;
        }
      }

      // Sauvegarder l'assignation dans Prisma
      await this.prisma.experimentAssignment.upsert({
        where: {
          userId_experimentId: {
            userId,
            experimentId,
          },
        },
        create: {
          userId,
          experimentId,
          variantId: selectedVariant,
        },
        update: {
          variantId: selectedVariant,
        },
      });

      return selectedVariant;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to assign variant: ${error instanceof Error ? errorMessage : 'Unknown error'}`, error instanceof Error ? errorStack : undefined);
      throw error;
    }
  }

  /**
   * Récupère l'assignation d'un utilisateur
   */
  async getAssignment(userId: string, experimentId: string): Promise<ExperimentAssignment | null> {
    try {
      const assignment = await this.prisma.experimentAssignment.findUnique({
        where: {
          userId_experimentId: {
            userId,
            experimentId,
          },
        },
      });

      if (!assignment) {
        return null;
      }

      return {
        userId: assignment.userId,
        experimentId: assignment.experimentId,
        variantId: assignment.variantId,
        assignedAt: assignment.assignedAt,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to get assignment: ${error instanceof Error ? errorMessage : 'Unknown error'}`, error instanceof Error ? errorStack : undefined);
      return null;
    }
  }

  /**
   * Enregistre une conversion
   */
  async recordConversion(
    userId: string | null,
    sessionId: string,
    experimentId: string,
    conversionType: 'purchase' | 'signup' | 'design_created',
    value?: number,
  ): Promise<void> {
    try {
      const assignment = userId
        ? await this.getAssignment(userId, experimentId)
        : await this.prisma.experimentAssignment.findFirst({
            where: {
              experimentId,
              // Pour les utilisateurs anonymes, on peut utiliser sessionId
            },
          });

      if (!assignment) {
        return; // Utilisateur pas dans l'expérience
      }

      // Sauvegarder dans table Conversion
      await this.prisma.conversion.create({
        data: {
          userId: userId || undefined,
          sessionId,
          experimentId,
          variantId: assignment.variantId,
          eventType: conversionType,
          value: value ? Math.round(value * 100) : undefined, // Convertir en centimes
          attribution: {},
        },
      });

      this.logger.debug(
        `Conversion recorded: ${conversionType} for experiment ${experimentId}, variant ${assignment.variantId}`,
      );
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to record conversion: ${error instanceof Error ? errorMessage : 'Unknown error'}`, error instanceof Error ? errorStack : undefined);
      // Ne pas throw, on ne veut pas bloquer le flux principal
    }
  }

  /**
   * Calcule les résultats d'une expérience
   */
  async getExperimentResults(experimentId: string): Promise<ExperimentResult[]> {
    try {
      // Récupérer l'expérience
      const experiment = await this.prisma.experiment.findUnique({
        where: { id: experimentId },
      });

      if (!experiment) {
        throw new NotFoundException('Experiment not found');
      }

      const variants = (experiment.variants as Experiment['variants']) || [];

      // Récupérer les conversions par variant
      const conversions = await this.prisma.conversion.findMany({
        where: { experimentId },
        select: {
          variantId: true,
          value: true,
          eventType: true,
        },
      });

      // Récupérer les assignations par variant
      const assignments = await this.prisma.experimentAssignment.findMany({
        where: { experimentId },
        select: { variantId: true },
      });

      // Find control variant for comparison
      const controlVariant = variants.find((v) => v.name.toLowerCase().includes('control'));
      const controlConversions = controlVariant 
        ? conversions.filter((c) => c.variantId === controlVariant.id)
        : [];
      const controlParticipants = controlVariant
        ? assignments.filter((a) => a.variantId === controlVariant.id).length
        : 0;
      const controlConversionRate = controlParticipants > 0 
        ? controlConversions.length / controlParticipants 
        : 0;

      // Calculer les résultats par variant
      const results: ExperimentResult[] = variants.map((variant) => {
        const variantConversions = conversions.filter((c) => c.variantId === variant.id);
        const variantParticipants = assignments.filter((a) => a.variantId === variant.id).length;

        const conversionsCount = variantConversions.length;
        const conversionRate = variantParticipants > 0 ? (conversionsCount / variantParticipants) * 100 : 0;
        const revenue = variantConversions.reduce((sum, c) => sum + (c.value || 0), 0) / 100; // Convertir en euros
        const avgOrderValue = conversionsCount > 0 ? revenue / conversionsCount : 0;

        // Calculer la significativité statistique avec un vrai z-test pour proportions
        const statisticalSignificance = this.calculateStatisticalSignificance(
          variantParticipants,
          conversionsCount,
          controlParticipants,
          controlConversions.length,
        );

        return {
          experimentId,
          variantId: variant.id,
          participants: variantParticipants,
          conversions: conversionsCount,
          conversionRate: Math.round(conversionRate * 100) / 100,
          revenue,
          avgOrderValue: Math.round(avgOrderValue * 100) / 100,
          statisticalSignificance: Math.round(statisticalSignificance * 100) / 100,
          winner: false, // Sera calculé après comparaison avec control
        };
      });

      // Déterminer le winner (comparer avec control)
      const control = results.find((r) => {
        const variant = variants.find((v) => v.id === r.variantId);
        return variant?.name.toLowerCase().includes('control');
      });

      if (control) {
        results.forEach((result) => {
          if (
            result.variantId !== control.variantId &&
            result.conversionRate > control.conversionRate &&
            (result.statisticalSignificance ?? 0) > 95
          ) {
            result.winner = true;
          }
        });
      }

      return results;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Failed to get experiment results: ${error instanceof Error ? errorMessage : 'Unknown error'}`, error instanceof Error ? errorStack : undefined);
      throw error;
    }
  }

  /**
   * Calculate statistical significance using z-test for proportions
   * Returns confidence level as percentage (0-100)
   */
  private calculateStatisticalSignificance(
    variantN: number,
    variantConversions: number,
    controlN: number,
    controlConversions: number,
  ): number {
    // Need minimum sample size for reliable results
    if (variantN < 30 || controlN < 30) {
      return 0;
    }

    // Calculate conversion rates
    const p1 = variantN > 0 ? variantConversions / variantN : 0;
    const p2 = controlN > 0 ? controlConversions / controlN : 0;

    // If rates are identical, no significance
    if (p1 === p2) {
      return 0;
    }

    // Pooled proportion
    const pooledP = (variantConversions + controlConversions) / (variantN + controlN);
    
    // Standard error
    const se = Math.sqrt(pooledP * (1 - pooledP) * (1 / variantN + 1 / controlN));
    
    // Avoid division by zero
    if (se === 0) {
      return 0;
    }

    // Z-score
    const zScore = Math.abs(p1 - p2) / se;

    // Convert z-score to confidence level (two-tailed test)
    // Using approximation of cumulative normal distribution
    const confidence = this.zScoreToConfidence(zScore);
    
    return confidence;
  }

  /**
   * Convert z-score to confidence level percentage
   * Uses approximation of cumulative normal distribution
   */
  private zScoreToConfidence(z: number): number {
    // Approximation constants for cumulative normal distribution
    const a1 = 0.254829592;
    const a2 = -0.284496736;
    const a3 = 1.421413741;
    const a4 = -1.453152027;
    const a5 = 1.061405429;
    const p = 0.3275911;

    const sign = z < 0 ? -1 : 1;
    z = Math.abs(z) / Math.sqrt(2);

    const t = 1.0 / (1.0 + p * z);
    const y = 1.0 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-z * z);

    // Two-tailed confidence level
    const cdf = 0.5 * (1.0 + sign * y);
    const twoTailedPValue = 2 * (1 - cdf);
    const confidence = (1 - twoTailedPValue) * 100;

    return Math.min(99.99, Math.max(0, confidence));
  }

  /**
   * Hash userId pour assignation consistante
   */
  private hashUserId(userId: string, experimentId: string): number {
    const str = `${userId}_${experimentId}`;
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash) % 100;
  }
}
































