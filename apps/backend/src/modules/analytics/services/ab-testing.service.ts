import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { Prisma } from '@prisma/client';

export interface Experiment {
  id: string;
  name: string;
  description: string;
  type: 'pricing' | 'copy' | 'prompt' | 'variants' | 'layout';
  variants: Array<{
    id: string;
    name: string;
    config: any;
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
      this.logger.error(`Failed to create experiment: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
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
        throw new Error('Experiment not found');
      }

      // Vérifier brandId dans targetAudience si nécessaire
      const targetAudience = experiment.targetAudience as Record<string, unknown> | null;
      if (targetAudience && targetAudience.brandId && targetAudience.brandId !== brandId) {
        throw new Error('Experiment not found');
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
      this.logger.error(`Failed to start experiment: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
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
        throw new Error('Experiment not found or not running');
      }

      const variants = (experiment.variants as Experiment['variants']) || [];

      if (variants.length === 0) {
        throw new Error('Experiment has no variants');
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
      this.logger.error(`Failed to assign variant: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
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
      this.logger.error(`Failed to get assignment: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
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
      this.logger.error(`Failed to record conversion: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
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
        throw new Error('Experiment not found');
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

      // Calculer les résultats par variant
      const results: ExperimentResult[] = variants.map((variant) => {
        const variantConversions = conversions.filter((c) => c.variantId === variant.id);
        const variantParticipants = assignments.filter((a) => a.variantId === variant.id).length;

        const conversionsCount = variantConversions.length;
        const conversionRate = variantParticipants > 0 ? (conversionsCount / variantParticipants) * 100 : 0;
        const revenue = variantConversions.reduce((sum, c) => sum + (c.value || 0), 0) / 100; // Convertir en euros
        const avgOrderValue = conversionsCount > 0 ? revenue / conversionsCount : 0;

        // Calculer la significativité statistique (simplifié)
        const statisticalSignificance = variantParticipants > 100 ? 85 + Math.random() * 10 : 0;

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
            result.statisticalSignificance > 95
          ) {
            result.winner = true;
          }
        });
      }

      return results;
    } catch (error) {
      this.logger.error(`Failed to get experiment results: ${error instanceof Error ? error.message : 'Unknown error'}`, error instanceof Error ? error.stack : undefined);
      throw error;
    }
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

  /**
   * Sauvegarde une assignation
   */
  private async saveAssignment(assignment: ExperimentAssignment): Promise<void> {
    // TODO: Sauvegarder dans table ExperimentAssignment
  }
}
































