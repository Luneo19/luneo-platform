import { Injectable, Logger } from '@nestjs/common';
import { AppErrorFactory } from '@/common/errors/app-error';
import { PrismaService } from '@/libs/prisma/prisma.service';

export interface IPClaim {
  id: string;
  claimantName: string;
  claimantEmail: string;
  claimantType: 'copyright' | 'trademark' | 'patent' | 'other';
  designId: string;
  description: string;
  evidence: string[]; // URLs de preuves
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'resolved';
  reviewedBy?: string;
  reviewedAt?: Date;
  resolution?: string;
}

@Injectable()
export class IPClaimsService {
  private readonly logger = new Logger(IPClaimsService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crée une réclamation IP
   */
  async createClaim(claim: Omit<IPClaim, 'id' | 'status'>): Promise<IPClaim> {
    // Vérifier que le design existe
    const design = await this.prisma.design.findUnique({
      where: { id: claim.designId },
      select: {
        id: true,
        brandId: true,
        status: true,
      },
    });

    if (!design) {
      throw AppErrorFactory.notFound('Design', claim.designId, { operation: 'createIPClaim' });
    }

    // Créer la réclamation
    const claimRecord: IPClaim = {
      id: `claim_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...claim,
      status: 'pending',
    };

    // TODO: Sauvegarder dans table IPClaim
    // Pour l'instant, log
    this.logger.log(`IP claim created: ${claimRecord.id} for design ${claim.designId}`);

    // Bloquer le design automatiquement
    await this.blockDesign(claim.designId, claimRecord.id);

    return claimRecord;
  }

  /**
   * Bloque un design
   */
  private async blockDesign(designId: string, claimId: string): Promise<void> {
    // TODO: Ajouter champ `blocked` ou `status` dans Design
    // Pour l'instant, mettre à jour metadata
    await this.prisma.design.update({
      where: { id: designId },
      data: {
        metadata: {
          ...((await this.prisma.design.findUnique({ where: { id: designId } }))?.metadata as any),
          blocked: true,
          blockedReason: `IP claim: ${claimId}`,
          blockedAt: new Date(),
        } as any,
      },
    });

    this.logger.log(`Design ${designId} blocked due to IP claim ${claimId}`);
  }

  /**
   * Révision d'une réclamation (admin)
   */
  async reviewClaim(
    claimId: string,
    status: 'approved' | 'rejected',
    reviewedBy: string,
    resolution?: string,
  ): Promise<IPClaim> {
    // TODO: Récupérer depuis table IPClaim
    const claim: IPClaim = {
      id: claimId,
      status: 'under_review',
    } as any;

    claim.status = status;
    claim.reviewedBy = reviewedBy;
    claim.reviewedAt = new Date();
    claim.resolution = resolution;

    if (status === 'approved') {
      // Le design reste bloqué
      this.logger.log(`IP claim ${claimId} approved, design remains blocked`);
    } else {
      // Débloquer le design
      await this.unblockDesign(claim.designId);
    }

    return claim;
  }

  /**
   * Débloque un design
   */
  private async unblockDesign(designId: string): Promise<void> {
    await this.prisma.design.update({
      where: { id: designId },
      data: {
        metadata: {
          ...((await this.prisma.design.findUnique({ where: { id: designId } }))?.metadata as any),
          blocked: false,
          blockedReason: null,
          blockedAt: null,
        } as any,
      },
    });

    this.logger.log(`Design ${designId} unblocked`);
  }

  /**
   * Liste les réclamations
   */
  async listClaims(status?: IPClaim['status'], limit: number = 50): Promise<IPClaim[]> {
    // TODO: Récupérer depuis table IPClaim
    return [];
  }
}





















