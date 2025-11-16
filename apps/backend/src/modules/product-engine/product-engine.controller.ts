import { 
  Controller, 
  Get, 
  Post, 
  Put, 
  Delete, 
  Body, 
  Param, 
  Query,
  UseGuards,
  HttpStatus,
  HttpCode
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { ProductRulesService } from './services/product-rules.service';
import { ZonesService } from './services/zones.service';
import { PricingEngine } from './services/pricing-engine.service';
import { ValidationEngine } from './services/validation-engine.service';
import {
  ProductRules,
  ProductZone,
  DesignOptions,
  ValidationResult,
  PricingContext,
  ZoneValidationContext,
  PricingSuggestion,
  RulesUsageStats,
} from './interfaces/product-rules.interface';

@ApiTags('Product Engine')
@Controller('product-engine')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class ProductEngineController {
  constructor(
    private readonly productRulesService: ProductRulesService,
    private readonly zonesService: ZonesService,
    private readonly pricingEngine: PricingEngine,
    private readonly validationEngine: ValidationEngine,
  ) {}

  // ========================================
  // PRODUCT RULES
  // ========================================

  @Get('products/:productId/rules')
  @ApiOperation({ summary: 'Récupère les règles d\'un produit' })
  @ApiResponse({ status: 200, description: 'Règles du produit récupérées avec succès' })
  @ApiResponse({ status: 404, description: 'Produit non trouvé' })
  async getProductRules(@Param('productId') productId: string): Promise<ProductRules | null> {
    return this.productRulesService.getProductRules(productId);
  }

  @Put('products/:productId/rules')
  @ApiOperation({ summary: 'Met à jour les règles d\'un produit' })
  @ApiResponse({ status: 200, description: 'Règles mises à jour avec succès' })
  @ApiResponse({ status: 400, description: 'Règles invalides' })
  @ApiResponse({ status: 404, description: 'Produit non trouvé' })
  async updateProductRules(
    @Param('productId') productId: string,
    @Body() rules: ProductRules
  ): Promise<ProductRules> {
    return this.productRulesService.updateProductRules(productId, rules);
  }

  @Get('products/:productId/rules/usage-stats')
  @ApiOperation({ summary: 'Obtient les statistiques d\'usage des règles' })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès' })
  async getRulesUsageStats(
    @Param('productId') productId: string,
    @Query('period') period: 'day' | 'week' | 'month' = 'week'
  ): Promise<RulesUsageStats> {
    return this.productRulesService.getRulesUsageStats(productId, period);
  }

  // ========================================
  // ZONES MANAGEMENT
  // ========================================

  @Get('products/:productId/zones')
  @ApiOperation({ summary: 'Récupère toutes les zones d\'un produit' })
  @ApiResponse({ status: 200, description: 'Zones récupérées avec succès' })
  async getZones(@Param('productId') productId: string): Promise<ProductZone[]> {
    return this.zonesService.getZones(productId);
  }

  @Get('products/:productId/zones/:zoneId')
  @ApiOperation({ summary: 'Récupère une zone spécifique' })
  @ApiResponse({ status: 200, description: 'Zone récupérée avec succès' })
  @ApiResponse({ status: 404, description: 'Zone non trouvée' })
  async getZone(
    @Param('productId') productId: string,
    @Param('zoneId') zoneId: string
  ): Promise<ProductZone | null> {
    return this.zonesService.getZone(productId, zoneId);
  }

  @Post('products/:productId/zones')
  @ApiOperation({ summary: 'Crée une nouvelle zone' })
  @ApiResponse({ status: 201, description: 'Zone créée avec succès' })
  @ApiResponse({ status: 400, description: 'Données de zone invalides' })
  async createZone(
    @Param('productId') productId: string,
    @Body() zone: Omit<ProductZone, 'id'>
  ): Promise<ProductZone> {
    return this.zonesService.createZone(productId, zone);
  }

  @Put('products/:productId/zones/:zoneId')
  @ApiOperation({ summary: 'Met à jour une zone existante' })
  @ApiResponse({ status: 200, description: 'Zone mise à jour avec succès' })
  @ApiResponse({ status: 400, description: 'Données de zone invalides' })
  @ApiResponse({ status: 404, description: 'Zone non trouvée' })
  async updateZone(
    @Param('productId') productId: string,
    @Param('zoneId') zoneId: string,
    @Body() updates: Partial<ProductZone>
  ): Promise<ProductZone> {
    return this.zonesService.updateZone(productId, zoneId, updates);
  }

  @Delete('products/:productId/zones/:zoneId')
  @ApiOperation({ summary: 'Supprime une zone' })
  @ApiResponse({ status: 204, description: 'Zone supprimée avec succès' })
  @ApiResponse({ status: 404, description: 'Zone non trouvée' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteZone(
    @Param('productId') productId: string,
    @Param('zoneId') zoneId: string
  ): Promise<void> {
    return this.zonesService.deleteZone(productId, zoneId);
  }

  @Post('products/:productId/zones/:zoneId/duplicate')
  @ApiOperation({ summary: 'Duplique une zone existante' })
  @ApiResponse({ status: 201, description: 'Zone dupliquée avec succès' })
  @ApiResponse({ status: 404, description: 'Zone non trouvée' })
  async duplicateZone(
    @Param('productId') productId: string,
    @Param('zoneId') zoneId: string
  ): Promise<ProductZone> {
    return this.zonesService.duplicateZone(productId, zoneId);
  }

  @Put('products/:productId/zones/reorder')
  @ApiOperation({ summary: 'Réorganise l\'ordre des zones' })
  @ApiResponse({ status: 200, description: 'Zones réorganisées avec succès' })
  @ApiResponse({ status: 400, description: 'Ordre invalide' })
  async reorderZones(
    @Param('productId') productId: string,
    @Body() zoneIds: string[]
  ): Promise<ProductZone[]> {
    return this.zonesService.reorderZones(productId, zoneIds);
  }

  @Get('products/:productId/zones/usage-stats')
  @ApiOperation({ summary: 'Obtient les statistiques d\'usage des zones' })
  @ApiResponse({ status: 200, description: 'Statistiques récupérées avec succès' })
  async getZoneUsageStats(
    @Param('productId') productId: string,
    @Query('period') period: 'day' | 'week' | 'month' = 'week'
  ): Promise<any> {
    return this.zonesService.getZoneUsageStats(productId, period);
  }

  @Get('products/:productId/zones/improvement-suggestions')
  @ApiOperation({ summary: 'Obtient des suggestions d\'amélioration pour les zones' })
  @ApiResponse({ status: 200, description: 'Suggestions récupérées avec succès' })
  async getZoneImprovementSuggestions(@Param('productId') productId: string): Promise<any> {
    return this.zonesService.getZoneImprovementSuggestions(productId);
  }

  // ========================================
  // VALIDATION
  // ========================================

  @Post('validate/design')
  @ApiOperation({ summary: 'Valide un design complet' })
  @ApiResponse({ status: 200, description: 'Design validé avec succès' })
  @ApiResponse({ status: 400, description: 'Design invalide' })
  async validateDesign(@Body() context: ZoneValidationContext): Promise<ValidationResult> {
    return this.validationEngine.validateDesign(context);
  }

  @Post('validate/coordinates')
  @ApiOperation({ summary: 'Valide les coordonnées d\'une zone' })
  @ApiResponse({ status: 200, description: 'Coordonnées validées avec succès' })
  async validateZoneCoordinates(
    @Body() body: {
      zone: Partial<ProductZone>;
      canvasWidth: number;
      canvasHeight: number;
    }
  ): Promise<any> {
    return this.zonesService.validateZoneCoordinates(
      body.zone,
      body.canvasWidth,
      body.canvasHeight
    );
  }

  @Post('validate/overlaps')
  @ApiOperation({ summary: 'Détecte les chevauchements entre zones' })
  @ApiResponse({ status: 200, description: 'Chevauchements détectés avec succès' })
  async detectZoneOverlaps(@Body() zones: ProductZone[]): Promise<any> {
    return this.zonesService.detectZoneOverlaps(zones);
  }

  // ========================================
  // PRICING
  // ========================================

  @Post('pricing/calculate')
  @ApiOperation({ summary: 'Calcule le prix d\'un design personnalisé' })
  @ApiResponse({ status: 200, description: 'Prix calculé avec succès' })
  @ApiResponse({ status: 400, description: 'Données de pricing invalides' })
  async calculatePrice(@Body() context: PricingContext): Promise<any> {
    return this.pricingEngine.calculatePrice(context);
  }

  @Get('pricing/products/:productId/suggestions')
  @ApiOperation({ summary: 'Obtient des suggestions de prix pour un produit' })
  @ApiResponse({ status: 200, description: 'Suggestions récupérées avec succès' })
  async getPricingSuggestions(@Param('productId') productId: string): Promise<PricingSuggestion> {
    return this.pricingEngine.getPricingSuggestions(productId);
  }

  @Post('pricing/products/:productId/cost')
  @ApiOperation({ summary: 'Calcule le prix de revient d\'un produit' })
  @ApiResponse({ status: 200, description: 'Prix de revient calculé avec succès' })
  async calculateCostPrice(
    @Param('productId') productId: string,
    @Body() options: DesignOptions
  ): Promise<any> {
    return this.pricingEngine.calculateCostPrice(productId, options);
  }

  // ========================================
  // ANALYTICS & INSIGHTS
  // ========================================

  @Get('analytics/products/:productId/performance')
  @ApiOperation({ summary: 'Obtient les métriques de performance d\'un produit' })
  @ApiResponse({ status: 200, description: 'Métriques récupérées avec succès' })
  async getProductPerformance(
    @Param('productId') productId: string,
    @Query('period') period: 'day' | 'week' | 'month' | 'year' = 'month'
  ): Promise<any> {
    // Combiner les statistiques des règles et des zones
    const normalizedPeriod: 'day' | 'week' | 'month' = period === 'year' ? 'month' : period;

    const [rulesStats, zoneStats] = await Promise.all([
      this.productRulesService.getRulesUsageStats(productId, normalizedPeriod),
      this.zonesService.getZoneUsageStats(productId, normalizedPeriod),
    ]);

    return {
      rules: rulesStats,
      zones: zoneStats,
      period,
      generatedAt: new Date(),
    };
  }

  @Get('analytics/products/:productId/optimization')
  @ApiOperation({ summary: 'Obtient des recommandations d\'optimisation' })
  @ApiResponse({ status: 200, description: 'Recommandations récupérées avec succès' })
  async getOptimizationRecommendations(@Param('productId') productId: string): Promise<any> {
    const [zoneSuggestions, pricingSuggestions] = await Promise.all([
      this.zonesService.getZoneImprovementSuggestions(productId),
      this.pricingEngine.getPricingSuggestions(productId),
    ]);

    return {
      zones: zoneSuggestions,
      pricing: pricingSuggestions,
      generatedAt: new Date(),
    };
  }

  // ========================================
  // TEMPLATES & PRESETS
  // ========================================

  @Get('templates/zone-presets')
  @ApiOperation({ summary: 'Obtient les presets de zones disponibles' })
  @ApiResponse({ status: 200, description: 'Presets récupérés avec succès' })
  async getZonePresets(): Promise<Record<string, ZonePreset[]>> {
    return {
      text: [
        {
          id: 'text-basic',
          name: 'Texte basique',
          type: 'text',
          constraints: {
            maxChars: 50,
            allowedFonts: ['arial', 'helvetica', 'times'],
          },
        },
        {
          id: 'text-premium',
          name: 'Texte premium',
          type: 'text',
          constraints: {
            maxChars: 100,
            allowedFonts: ['helvetica-neue', 'futura', 'bodoni'],
          },
          priceDeltaCents: 50,
        },
      ],
      image: [
        {
          id: 'image-standard',
          name: 'Image standard',
          type: 'image',
          allowedMime: ['image/png', 'image/jpeg'],
          maxResolution: { w: 2000, h: 2000 },
        },
        {
          id: 'image-hd',
          name: 'Image HD',
          type: 'image',
          allowedMime: ['image/png', 'image/jpeg'],
          maxResolution: { w: 4000, h: 4000 },
          priceDeltaCents: 100,
        },
      ],
      color: [
        {
          id: 'color-basic',
          name: 'Couleur basique',
          type: 'color',
          constraints: {
            allowedColors: ['red', 'blue', 'green', 'black', 'white'],
          },
        },
        {
          id: 'color-premium',
          name: 'Couleur premium',
          type: 'color',
          constraints: {
            allowedColors: ['gold', 'silver', 'rose-gold', 'platinum'],
          },
          priceDeltaCents: 150,
        },
      ],
      select: [
        {
          id: 'select-material',
          name: 'Sélection matériau',
          type: 'select',
          metadata: {
            options: ['cotton', 'polyester', 'silk', 'linen'],
          },
        },
        {
          id: 'select-finish',
          name: 'Sélection finition',
          type: 'select',
          metadata: {
            options: ['matte', 'glossy', 'embossed', 'engraved'],
          },
          priceDeltaCents: 75,
        },
      ],
    };
  }

  @Post('templates/apply-preset')
  @ApiOperation({ summary: 'Applique un preset de zone à un produit' })
  @ApiResponse({ status: 201, description: 'Preset appliqué avec succès' })
  @ApiResponse({ status: 400, description: 'Preset invalide' })
  async applyZonePreset(
    @Body() body: {
      productId: string;
      presetId: string;
      position?: { x: number; y: number };
    }
  ): Promise<ProductZone> {
    const presets = await this.getZonePresets();
    
    // Trouver le preset
    let preset: ZonePreset | null = null;
    for (const category of Object.values(presets)) {
      const found = category.find((p) => p.id === body.presetId);
      if (found) {
        preset = found;
        break;
      }
    }

    if (!preset) {
      throw new Error(`Preset ${body.presetId} not found`);
    }

    // Créer la zone avec le preset
    const { id: _presetId, name, ...presetConfig } = preset;

    const presetWidth = typeof presetConfig.width === 'number' ? presetConfig.width : 200;
    const presetHeight = typeof presetConfig.height === 'number' ? presetConfig.height : 100;

    const zoneData: Omit<ProductZone, 'id'> = {
      label: name,
      type: preset.type ?? 'image',
      x: body.position?.x ?? 100,
      y: body.position?.y ?? 100,
      width: presetWidth,
      height: presetHeight,
      ...presetConfig,
    };

    return this.zonesService.createZone(body.productId, zoneData);
  }
}


interface ZonePreset extends Partial<ProductZone> {
  id: string;
  name: string;
}
