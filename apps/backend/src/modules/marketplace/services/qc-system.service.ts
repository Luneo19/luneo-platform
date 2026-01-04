import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface QCReport {
  workOrderId: string;
  overallScore: number; // 0-10
  issues: Array<{
    type: 'defect' | 'dimension' | 'finish' | 'material' | 'other';
    severity: 'minor' | 'major' | 'critical';
    description: string;
    photos?: string[];
  }>;
  recommendations: string[];
  passed: boolean;
}

@Injectable()
export class QCSystemService {
  private readonly logger = new Logger(QCSystemService.name);

  // Seuils de quarantaine
  private readonly QUARANTINE_THRESHOLDS = {
    defectRate: 0.15, // 15% de défauts
    returnRate: 0.20, // 20% de retours
    onTimeRate: 0.70, // 70% à temps
    qualityScore: 3.5, // Score qualité < 3.5/5
  };

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crée un rapport QC
   */
  async createQCReport(report: QCReport) {
    const workOrder = await this.prisma.workOrder.findUnique({
      where: { id: report.workOrderId },
      include: { artisan: true },
    });

    if (!workOrder) {
      throw new Error(`WorkOrder ${report.workOrderId} not found`);
    }

    // Créer le rapport QC
    const qcReport = await this.prisma.qualityReport.create({
      data: {
        orderId: report.workOrderId,
        overallScore: report.overallScore,
        issues: report.issues.map((i) => i.description),
        recommendations: report.recommendations,
        passed: report.passed,
      },
    });

    // Mettre à jour le work order
    await this.prisma.workOrder.update({
      where: { id: report.workOrderId },
      data: {
        qcScore: report.overallScore,
        qcPassed: report.passed,
        qcIssues: report.issues.map((i) => i.description),
        qcReportId: qcReport.id,
        status: report.passed ? 'qc_passed' : 'qc_failed',
      },
    });

    // Mettre à jour les stats de l'artisan
    await this.updateArtisanQCStats(workOrder.artisanId, report);

    // Vérifier si quarantaine nécessaire
    await this.checkQuarantine(workOrder.artisanId);

    this.logger.log(
      `QC report created for workOrder ${report.workOrderId}: ${report.passed ? 'PASSED' : 'FAILED'}, score: ${report.overallScore}`,
    );

    return qcReport;
  }

  /**
   * Met à jour les statistiques QC de l'artisan
   */
  private async updateArtisanQCStats(artisanId: string, report: QCReport) {
    const artisan = await this.prisma.artisan.findUnique({
      where: { id: artisanId },
    });

    if (!artisan) {
      return;
    }

    // Calculer le nouveau taux de défauts
    const totalOrders = artisan.totalOrders || 0;
    const currentDefectRate = artisan.defectRate || 0.0;

    const newDefectRate = totalOrders > 0
      ? (currentDefectRate * (totalOrders - 1) + (report.passed ? 0 : 1)) / totalOrders
      : (report.passed ? 0 : 1);

    // Mettre à jour le score qualité
    const currentQualityScore = artisan.qualityScore || 5.0;
    const newQualityScore = totalOrders > 0
      ? (currentQualityScore * (totalOrders - 1) + report.overallScore) / totalOrders
      : report.overallScore;

    await this.prisma.artisan.update({
      where: { id: artisanId },
      data: {
        defectRate: newDefectRate,
        qualityScore: newQualityScore,
      },
    });
  }

  /**
   * Vérifie si un artisan doit être mis en quarantaine
   */
  private async checkQuarantine(artisanId: string) {
    const artisan = await this.prisma.artisan.findUnique({
      where: { id: artisanId },
    });

    if (!artisan) {
      return;
    }

    const shouldQuarantine =
      artisan.defectRate >= this.QUARANTINE_THRESHOLDS.defectRate ||
      artisan.returnRate >= this.QUARANTINE_THRESHOLDS.returnRate ||
      artisan.onTimeDeliveryRate < this.QUARANTINE_THRESHOLDS.onTimeRate ||
      artisan.qualityScore < this.QUARANTINE_THRESHOLDS.qualityScore;

    if (shouldQuarantine && artisan.status !== 'quarantined') {
      // Mettre en quarantaine
      await this.prisma.artisan.update({
        where: { id: artisanId },
        data: {
          status: 'quarantined',
          quarantineReason: this.generateQuarantineReason(artisan),
          quarantineUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 jours
        },
      });

      this.logger.warn(`Artisan ${artisanId} quarantined due to poor performance`);
    } else if (!shouldQuarantine && artisan.status === 'quarantined') {
      // Retirer de la quarantaine si les seuils sont respectés
      await this.prisma.artisan.update({
        where: { id: artisanId },
        data: {
          status: 'active',
          quarantineReason: null,
          quarantineUntil: null,
        },
      });

      this.logger.log(`Artisan ${artisanId} removed from quarantine`);
    }
  }

  /**
   * Génère la raison de quarantaine
   */
  private generateQuarantineReason(artisan: any): string {
    const reasons: string[] = [];

    if (artisan.defectRate >= this.QUARANTINE_THRESHOLDS.defectRate) {
      reasons.push(`High defect rate: ${(artisan.defectRate * 100).toFixed(1)}%`);
    }

    if (artisan.returnRate >= this.QUARANTINE_THRESHOLDS.returnRate) {
      reasons.push(`High return rate: ${(artisan.returnRate * 100).toFixed(1)}%`);
    }

    if (artisan.onTimeDeliveryRate < this.QUARANTINE_THRESHOLDS.onTimeRate) {
      reasons.push(`Low on-time rate: ${(artisan.onTimeDeliveryRate * 100).toFixed(1)}%`);
    }

    if (artisan.qualityScore < this.QUARANTINE_THRESHOLDS.qualityScore) {
      reasons.push(`Low quality score: ${artisan.qualityScore.toFixed(1)}/5`);
    }

    return reasons.join(', ');
  }

  /**
   * Récupère les statistiques QC d'un artisan
   */
  async getArtisanQCStats(artisanId: string) {
    const artisan = await this.prisma.artisan.findUnique({
      where: { id: artisanId },
    });

    if (!artisan) {
      throw new Error(`Artisan ${artisanId} not found`);
    }

    // Récupérer les rapports QC récents
    const recentReports = await this.prisma.qualityReport.findMany({
      where: {
        orderId: {
          in: await this.prisma.workOrder
            .findMany({
              where: { artisanId },
              select: { id: true },
            })
            .then((wos) => wos.map((wo) => wo.id)),
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });

    return {
      artisan: {
        qualityScore: artisan.qualityScore,
        defectRate: artisan.defectRate,
        returnRate: artisan.returnRate,
        onTimeDeliveryRate: artisan.onTimeDeliveryRate,
        totalOrders: artisan.totalOrders,
        completedOrders: artisan.completedOrders,
      },
      recentReports: recentReports.map((r) => ({
        score: r.overallScore,
        passed: r.passed,
        issues: r.issues,
        createdAt: r.createdAt,
      })),
    };
  }
}





























