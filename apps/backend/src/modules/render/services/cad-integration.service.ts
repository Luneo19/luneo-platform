import { Injectable, Logger } from '@nestjs/common';
import { CADValidationService } from '@/libs/cad/cad-validation.service';
import { CADValidationRequest, CADValidationResult } from '@/libs/cad/cad-constraints.interface';
import { LODService } from '@/libs/3d/lod.service';
import { MarketingRenderService } from '@/libs/3d/marketing-render.service';
import { VariantService, MaterialVariant } from '@/libs/3d/variant.service';

/**
 * Service d'intégration CAD pour le module Render
 * Combine validation CAD, LOD, et rendu marketing
 */
@Injectable()
export class CADIntegrationService {
  private readonly logger = new Logger(CADIntegrationService.name);

  constructor(
    private readonly cadValidation: CADValidationService,
    private readonly lodService: LODService,
    private readonly marketingRender: MarketingRenderService,
    private readonly variantService: VariantService,
  ) {}

  /**
   * Valide un design pour la production
   */
  async validateForProduction(request: CADValidationRequest): Promise<CADValidationResult> {
    return this.cadValidation.validate(request);
  }

  /**
   * Génère les LODs pour un design
   */
  async generateLODs(designId: string, sourceModelUrl: string): Promise<Record<string, string>> {
    return this.lodService.generateLODs(designId, sourceModelUrl);
  }

  /**
   * Génère un rendu marketing
   */
  async generateMarketingRender(request: {
    designId: string;
    productId: string;
    type: 'packshot' | 'lifestyle' | 'turntable' | 'detail';
    options?: any;
  }) {
    return this.marketingRender.render(request);
  }

  /**
   * Génère un variant (matériau/pierre) sans re-export
   */
  async generateVariant(
    designId: string,
    baseModelUrl: string,
    material: MaterialVariant,
  ): Promise<string> {
    return this.variantService.generateVariant(designId, baseModelUrl, material);
  }

  /**
   * Génère plusieurs variants en batch
   */
  async generateVariantsBatch(
    designId: string,
    baseModelUrl: string,
    materials: MaterialVariant[],
  ): Promise<Record<string, string>> {
    return this.variantService.generateVariantsBatch(designId, baseModelUrl, materials);
  }
}

































