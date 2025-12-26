import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

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
  async createExperiment(experiment: Omit<Experiment, 'id' | 'status'>): Promise<Experiment> {
    const exp: Experiment = {
      id: `exp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...experiment,
      status: 'draft',
    };

    // TODO: Sauvegarder dans table Experiment
    this.logger.log(`Experiment created: ${exp.id} - ${exp.name}`);

    return exp;
  }

  /**
   * Démarre une expérience
   */
  async startExperiment(experimentId: string): Promise<Experiment> {
    // TODO: Récupérer depuis table Experiment
    const experiment: Experiment = {
      id: experimentId,
      status: 'running',
      startDate: new Date(),
    } as any;

    this.logger.log(`Experiment started: ${experimentId}`);

    return experiment;
  }

  /**
   * Assigne un utilisateur à une variante
   */
  async assignVariant(userId: string, experimentId: string): Promise<string> {
    // Vérifier si déjà assigné
    const existing = await this.getAssignment(userId, experimentId);
    if (existing) {
      return existing.variantId;
    }

    // TODO: Récupérer expérience depuis table
    const experiment: Experiment = {
      id: experimentId,
      variants: [
        { id: 'control', name: 'Control', config: {}, weight: 50 },
        { id: 'variant_a', name: 'Variant A', config: {}, weight: 50 },
      ],
    } as any;

    // Assigner selon poids (hash userId pour consistance)
    const hash = this.hashUserId(userId, experimentId);
    const totalWeight = experiment.variants.reduce((sum, v) => sum + v.weight, 0);
    let cumulative = 0;
    let selectedVariant = experiment.variants[0].id;

    for (const variant of experiment.variants) {
      cumulative += variant.weight;
      if (hash < (cumulative / totalWeight) * 100) {
        selectedVariant = variant.id;
        break;
      }
    }

    // Sauvegarder l'assignation
    await this.saveAssignment({
      userId,
      experimentId,
      variantId: selectedVariant,
      assignedAt: new Date(),
    });

    return selectedVariant;
  }

  /**
   * Récupère l'assignation d'un utilisateur
   */
  async getAssignment(userId: string, experimentId: string): Promise<ExperimentAssignment | null> {
    // TODO: Récupérer depuis table ExperimentAssignment
    return null;
  }

  /**
   * Enregistre une conversion
   */
  async recordConversion(
    userId: string,
    experimentId: string,
    conversionType: 'purchase' | 'signup' | 'design_created',
    value?: number,
  ): Promise<void> {
    const assignment = await this.getAssignment(userId, experimentId);
    if (!assignment) {
      return; // Utilisateur pas dans l'expérience
    }

    // TODO: Sauvegarder dans table Conversion
    this.logger.debug(
      `Conversion recorded: ${conversionType} for experiment ${experimentId}, variant ${assignment.variantId}`,
    );
  }

  /**
   * Calcule les résultats d'une expérience
   */
  async getExperimentResults(experimentId: string): Promise<ExperimentResult[]> {
    // TODO: Calculer depuis table Conversion
    // Pour l'instant, simulation
    return [];
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





















