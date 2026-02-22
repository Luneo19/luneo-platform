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
    const { claimantName, claimantEmail, claimantType, designId, description, evidence } = claim;
    const created = await this.prisma.iPClaim.create({
      data: {
        claimantName,
        claimantEmail,
        claimantType,
        designId,
        description,
        evidence,
      },
    });

    this.logger.log(`IP claim created: ${created.id} for design ${claim.designId}`);

    // Bloquer le design automatiquement
    await this.blockDesign(claim.designId, created.id);

    return {
      id: created.id,
      claimantName: created.claimantName,
      claimantEmail: created.claimantEmail,
      claimantType: created.claimantType as IPClaim['claimantType'],
      designId: created.designId,
      description: created.description,
      evidence: created.evidence,
      status: created.status as IPClaim['status'],
      reviewedBy: created.reviewedBy ?? undefined,
      reviewedAt: created.reviewedAt ?? undefined,
      resolution: created.resolution ?? undefined,
    };
  }

  /**
   * Bloque un design
   */
  private async blockDesign(designId: string, claimId: string): Promise<void> {
    await this.prisma.design.update({
      where: { id: designId },
      data: {
        isBlocked: true,
        blockedReason: 'IP claim filed',
        blockedAt: new Date(),
        blockedByClaimId: claimId,
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
    const claim = await this.prisma.iPClaim.findUnique({ where: { id: claimId } });
    if (!claim) {
      throw AppErrorFactory.notFound('IPClaim', claimId, { operation: 'reviewClaim' });
    }

    const updated = await this.prisma.iPClaim.update({
      where: { id: claimId },
      data: {
        status,
        reviewedBy,
        reviewedAt: new Date(),
        resolution,
      },
    });

    if (status === 'approved') {
      this.logger.log(`IP claim ${claimId} approved, design remains blocked`);
    } else {
      await this.unblockDesign(claim.designId);
    }

    return {
      id: updated.id,
      claimantName: updated.claimantName,
      claimantEmail: updated.claimantEmail,
      claimantType: updated.claimantType as IPClaim['claimantType'],
      designId: updated.designId,
      description: updated.description,
      evidence: updated.evidence,
      status: updated.status as IPClaim['status'],
      reviewedBy: updated.reviewedBy ?? undefined,
      reviewedAt: updated.reviewedAt ?? undefined,
      resolution: updated.resolution ?? undefined,
    };
  }

  /**
   * Débloque un design
   */
  private async unblockDesign(designId: string): Promise<void> {
    await this.prisma.design.update({
      where: { id: designId },
      data: {
        isBlocked: false,
        blockedReason: null,
        blockedAt: null,
        blockedByClaimId: null,
      },
    });

    this.logger.log(`Design ${designId} unblocked`);
  }

  /**
   * Récupère une réclamation par id
   */
  async getClaim(claimId: string): Promise<IPClaim | null> {
    const row = await this.prisma.iPClaim.findUnique({ where: { id: claimId } });
    if (!row) return null;
    return {
      id: row.id,
      claimantName: row.claimantName,
      claimantEmail: row.claimantEmail,
      claimantType: row.claimantType as IPClaim['claimantType'],
      designId: row.designId,
      description: row.description,
      evidence: row.evidence,
      status: row.status as IPClaim['status'],
      reviewedBy: row.reviewedBy ?? undefined,
      reviewedAt: row.reviewedAt ?? undefined,
      resolution: row.resolution ?? undefined,
    };
  }

  /**
   * Liste les réclamations
   */
  async listClaims(
    status?: IPClaim['status'],
    limit: number = 50,
    designId?: string,
  ): Promise<IPClaim[]> {
    const rows = await this.prisma.iPClaim.findMany({
      where: {
        ...(status && { status }),
        ...(designId && { designId }),
      },
      orderBy: { createdAt: 'desc' },
      take: limit || 50,
    });
    return rows.map((r) => ({
      id: r.id,
      claimantName: r.claimantName,
      claimantEmail: r.claimantEmail,
      claimantType: r.claimantType as IPClaim['claimantType'],
      designId: r.designId,
      description: r.description,
      evidence: r.evidence,
      status: r.status as IPClaim['status'],
      reviewedBy: r.reviewedBy ?? undefined,
      reviewedAt: r.reviewedAt ?? undefined,
      resolution: r.resolution ?? undefined,
    }));
  }
}

































