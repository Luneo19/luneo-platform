import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { SmartCacheService } from '@/libs/cache/smart-cache.service';
import { S3Service } from '@/libs/s3/s3.service';

interface ProductionJobData {
  orderId: string;
  brandId: string;
  designId: string;
  productId: string;
  quantity: number;
  options: any;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  factoryWebhookUrl?: string;
  shippingAddress: any;
  billingAddress: any;
}

interface ProductionBundle {
  orderId: string;
  files: Array<{
    filename: string;
    url: string;
    type: 'design' | 'instructions' | 'metadata';
    format: string;
    size: number;
  }>;
  instructions: {
    quantity: number;
    materials: string[];
    finishes: string[];
    specialInstructions: string[];
    qualityLevel: string;
    deadline: Date;
  };
  metadata: {
    brandId: string;
    productId: string;
    designId: string;
    createdAt: Date;
    version: string;
  };
}

@Processor('production-processing')
export class ProductionWorker {
  private readonly logger = new Logger(ProductionWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: SmartCacheService,
    private readonly s3Service: S3Service,
  ) {}

  @Process('create-production-bundle')
  async createProductionBundle(job: Job<ProductionJobData>) {
    const { orderId, brandId, designId, productId, quantity, options } = job.data;
    const startTime = Date.now();

    try {
      this.logger.log(`Creating production bundle for order ${orderId}`);

      // Mettre à jour le statut de la commande
      await this.updateOrderStatus(orderId, 'PROCESSING');

      // Récupérer les données nécessaires
      const [order, design, product, brand] = await Promise.all([
        this.getOrder(orderId),
        this.getDesign(designId),
        this.getProduct(productId),
        this.getBrand(brandId),
      ]);

      // Valider les données
      await this.validateProductionData(order, design, product, brand);

      // Générer les fichiers de production
      const productionFiles = await this.generateProductionFiles(design, product, options);

      // Créer les instructions de production
      const instructions = await this.createProductionInstructions(order, design, product, options);

      // Créer le bundle de production
      const bundle: ProductionBundle = {
        orderId,
        files: productionFiles,
        instructions,
        metadata: {
          brandId,
          productId,
          designId,
          createdAt: new Date(),
          version: '1.0',
        },
      };

      // Uploader le bundle vers S3
      const bundleUrl = await this.uploadProductionBundle(bundle);

      // Mettre à jour la commande avec le bundle
      await this.updateOrderWithBundle(orderId, bundleUrl);

      // Envoyer le webhook à l'usine si configuré
      if (job.data.factoryWebhookUrl) {
        await this.sendFactoryWebhook(job.data.factoryWebhookUrl, bundle, orderId);
      }

      // Mettre à jour le statut final
      await this.updateOrderStatus(orderId, 'READY_FOR_PRODUCTION');

      const totalTime = Date.now() - startTime;
      this.logger.log(`Production bundle created for order ${orderId} in ${totalTime}ms`);

      return {
        orderId,
        status: 'success',
        bundleUrl,
        processingTime: totalTime,
      };

    } catch (error) {
      this.logger.error(`Production bundle creation failed for order ${orderId}:`, error);
      
      await this.updateOrderStatus(orderId, 'PRODUCTION_FAILED', error.message);
      throw error;
    }
  }

  @Process('quality-control')
  async qualityControl(job: Job<ProductionJobData>) {
    const { orderId, designId, productId } = job.data;

    try {
      this.logger.log(`Starting quality control for order ${orderId}`);

      // Récupérer les assets du design
      const assets = await this.prisma.asset.findMany({
        where: { designId },
        select: {
          id: true,
          url: true,
          type: true,
          metaJson: true,
        },
      });

      // Vérifier la qualité de chaque asset
      const qualityChecks = await Promise.all(
        assets.map(asset => this.checkAssetQuality(asset))
      );

      // Analyser les résultats
      const qualityReport = this.analyzeQualityChecks(qualityChecks);

      // Sauvegarder le rapport de qualité
      await this.saveQualityReport(orderId, qualityReport);

      // Décider si la production peut continuer
      if (qualityReport.overallScore < 0.8) {
        await this.updateOrderStatus(orderId, 'QUALITY_ISSUE', 'Quality control failed');
        throw new Error(`Quality control failed: ${qualityReport.issues.join(', ')}`);
      }

      this.logger.log(`Quality control passed for order ${orderId}`);

      return {
        orderId,
        status: 'quality_passed',
        qualityReport,
      };

    } catch (error) {
      this.logger.error(`Quality control failed for order ${orderId}:`, error);
      throw error;
    }
  }

  @Process('track-production')
  async trackProduction(job: Job<{ orderId: string; factoryId: string }>) {
    const { orderId, factoryId } = job.data;

    try {
      this.logger.log(`Tracking production for order ${orderId}`);

      // Simuler le suivi de production
      const productionStages = [
        { stage: 'received', message: 'Commande reçue par l\'usine', percentage: 10 },
        { stage: 'materials', message: 'Préparation des matériaux', percentage: 25 },
        { stage: 'production', message: 'Production en cours', percentage: 60 },
        { stage: 'quality', message: 'Contrôle qualité', percentage: 80 },
        { stage: 'packaging', message: 'Emballage', percentage: 95 },
        { stage: 'shipped', message: 'Expédié', percentage: 100 },
      ];

      // Mettre à jour le statut de production
      for (const stage of productionStages) {
        await this.updateProductionStatus(orderId, stage.stage, stage.message, stage.percentage);
        
        // Simuler un délai entre les étapes
        await new Promise(resolve => setTimeout(resolve, 2000));
      }

      // Finaliser la production
      await this.updateOrderStatus(orderId, 'SHIPPED');

      this.logger.log(`Production tracking completed for order ${orderId}`);

      return {
        orderId,
        status: 'production_completed',
        stages: productionStages,
      };

    } catch (error) {
      this.logger.error(`Production tracking failed for order ${orderId}:`, error);
      throw error;
    }
  }

  @Process('generate-manufacturing-instructions')
  async generateManufacturingInstructions(job: Job<ProductionJobData>) {
    const { orderId, designId, productId, quantity, options } = job.data;

    try {
      this.logger.log(`Generating manufacturing instructions for order ${orderId}`);

      // Récupérer les données
      const [design, product] = await Promise.all([
        this.getDesign(designId),
        this.getProduct(productId),
      ]);

      // Générer les instructions détaillées
      const instructions = {
        orderId,
        product: {
          name: product.name,
          sku: product.sku,
          baseSpecifications: product.specifications || {},
        },
        design: {
          customizations: design.optionsJson,
          zones: this.extractZonesFromDesign(design),
        },
        manufacturing: {
          quantity,
          materials: options.materials || [],
          finishes: options.finishes || [],
          qualityLevel: options.qualityLevel || 'standard',
          specialRequirements: options.specialRequirements || [],
        },
        quality: {
          standards: ['ISO 9001', 'CE'],
          checkpoints: this.generateQualityCheckpoints(design, product),
          tolerances: this.calculateTolerances(product, options),
        },
        packaging: {
          requirements: this.generatePackagingRequirements(product, quantity),
          labeling: this.generateLabelingRequirements(orderId, product, design),
        },
      };

      // Créer le document d'instructions
      const instructionsDocument = await this.createInstructionsDocument(instructions);

      // Uploader les instructions
      const instructionsUrl = await this.uploadInstructions(instructionsDocument, orderId);

      // Sauvegarder la référence
      await this.saveInstructionsReference(orderId, instructionsUrl);

      this.logger.log(`Manufacturing instructions generated for order ${orderId}`);

      return {
        orderId,
        status: 'instructions_generated',
        instructionsUrl,
      };

    } catch (error) {
      this.logger.error(`Manufacturing instructions generation failed for order ${orderId}:`, error);
      throw error;
    }
  }

  /**
   * Récupère une commande
   */
  private async getOrder(orderId: string): Promise<any> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        design: true,
        product: true,
        brand: true,
      },
    });

    if (!order) {
      throw new Error(`Order ${orderId} not found`);
    }

    return order;
  }

  /**
   * Récupère un design
   */
  private async getDesign(designId: string): Promise<any> {
    const design = await this.prisma.design.findUnique({
      where: { id: designId },
      include: {
        assets: true,
      },
    });

    if (!design) {
      throw new Error(`Design ${designId} not found`);
    }

    return design;
  }

  /**
   * Récupère un produit
   */
  private async getProduct(productId: string): Promise<any> {
    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new Error(`Product ${productId} not found`);
    }

    return product;
  }

  /**
   * Récupère une marque
   */
  private async getBrand(brandId: string): Promise<any> {
    const brand = await this.prisma.brand.findUnique({
      where: { id: brandId },
    });

    if (!brand) {
      throw new Error(`Brand ${brandId} not found`);
    }

    return brand;
  }

  /**
   * Valide les données de production
   */
  private async validateProductionData(order: any, design: any, product: any, brand: any): Promise<void> {
    if (order.status !== 'PAID') {
      throw new Error('Order must be paid before production');
    }

    if (design.status !== 'COMPLETED') {
      throw new Error('Design must be completed before production');
    }

    if (!product.isActive) {
      throw new Error('Product is not active');
    }

    if (brand.status !== 'ACTIVE') {
      throw new Error('Brand is not active');
    }
  }

  /**
   * Génère les fichiers de production
   */
  private async generateProductionFiles(design: any, product: any, options: any): Promise<any[]> {
    const files = [];

    // Fichiers du design
    for (const asset of design.assets) {
      files.push({
        filename: `design_${asset.id}.${asset.type}`,
        url: asset.url,
        type: 'design',
        format: asset.type,
        size: asset.metaJson?.size || 0,
      });
    }

    // Fichiers de spécifications
    if (product.baseAssetUrl) {
      files.push({
        filename: 'product_specifications.png',
        url: product.baseAssetUrl,
        type: 'instructions',
        format: 'png',
        size: 0,
      });
    }

    return files;
  }

  /**
   * Crée les instructions de production
   */
  private async createProductionInstructions(order: any, design: any, product: any, options: any): Promise<any> {
    return {
      quantity: order.quantity,
      materials: options.materials || ['standard'],
      finishes: options.finishes || ['standard'],
      specialInstructions: options.specialInstructions || [],
      qualityLevel: options.qualityLevel || 'standard',
      deadline: this.calculateDeadline(order.createdAt, product.productionTime || 5),
    };
  }

  /**
   * Calcule la deadline
   */
  private calculateDeadline(orderDate: Date, productionDays: number): Date {
    const deadline = new Date(orderDate);
    deadline.setDate(deadline.getDate() + productionDays);
    return deadline;
  }

  /**
   * Upload le bundle de production
   */
  private async uploadProductionBundle(bundle: ProductionBundle): Promise<string> {
    const bundleData = JSON.stringify(bundle, null, 2);
    const filename = `production-bundles/${bundle.orderId}/bundle.json`;

    const uploadResult = await this.s3Service.uploadBuffer(
      Buffer.from(bundleData),
      filename,
      {
        contentType: 'application/json',
        metadata: {
          orderId: bundle.orderId,
          type: 'production-bundle',
          version: bundle.metadata.version,
        },
      }
    );

    return uploadResult.url;
  }

  /**
   * Met à jour la commande avec le bundle
   */
  private async updateOrderWithBundle(orderId: string, bundleUrl: string): Promise<void> {
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        productionBundleUrl: bundleUrl,
        metadata: {
          bundleGeneratedAt: new Date(),
        },
      },
    });
  }

  /**
   * Envoie le webhook à l'usine
   */
  private async sendFactoryWebhook(webhookUrl: string, bundle: ProductionBundle, orderId: string): Promise<void> {
    try {
      const payload = {
        orderId,
        bundleUrl: bundle.files[0]?.url, // URL du bundle principal
        instructions: bundle.instructions,
        metadata: bundle.metadata,
        timestamp: new Date().toISOString(),
      };

      const response = await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Luneo-Signature': this.generateWebhookSignature(payload),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed: ${response.statusText}`);
      }

      this.logger.log(`Factory webhook sent successfully for order ${orderId}`);
    } catch (error) {
      this.logger.error(`Factory webhook failed for order ${orderId}:`, error);
      // Ne pas faire échouer le job pour une erreur de webhook
    }
  }

  /**
   * Génère la signature du webhook
   */
  private generateWebhookSignature(payload: any): string {
    // Simulation de signature HMAC
    // En production, utiliser crypto.createHmac
    return `sha256=${Buffer.from(JSON.stringify(payload)).toString('base64')}`;
  }

  /**
   * Met à jour le statut de la commande
   */
  private async updateOrderStatus(orderId: string, status: string, error?: string): Promise<void> {
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        status,
        ...(error && { metadata: { error, updatedAt: new Date() } }),
      },
    });
  }

  /**
   * Met à jour le statut de production
   */
  private async updateProductionStatus(orderId: string, stage: string, message: string, percentage: number): Promise<void> {
    await this.prisma.productionStatus.upsert({
      where: { orderId },
      update: {
        currentStage: stage,
        message,
        percentage,
        lastUpdated: new Date(),
      },
      create: {
        orderId,
        currentStage: stage,
        message,
        percentage,
        lastUpdated: new Date(),
      },
    });
  }

  /**
   * Vérifie la qualité d'un asset
   */
  private async checkAssetQuality(asset: any): Promise<any> {
    // Simulation de vérification de qualité
    const qualityScore = Math.random() * 0.4 + 0.6; // Score entre 0.6 et 1.0
    
    return {
      assetId: asset.id,
      qualityScore,
      issues: qualityScore < 0.8 ? ['Low resolution', 'Poor contrast'] : [],
      recommendations: qualityScore < 0.9 ? ['Improve contrast', 'Increase resolution'] : [],
    };
  }

  /**
   * Analyse les vérifications de qualité
   */
  private analyzeQualityChecks(qualityChecks: any[]): any {
    const overallScore = qualityChecks.reduce((sum, check) => sum + check.qualityScore, 0) / qualityChecks.length;
    const allIssues = qualityChecks.flatMap(check => check.issues);
    const allRecommendations = qualityChecks.flatMap(check => check.recommendations);

    return {
      overallScore,
      issues: allIssues,
      recommendations: allRecommendations,
      passed: overallScore >= 0.8,
      assetCount: qualityChecks.length,
    };
  }

  /**
   * Sauvegarde le rapport de qualité
   */
  private async saveQualityReport(orderId: string, qualityReport: any): Promise<void> {
    await this.prisma.qualityReport.create({
      data: {
        orderId,
        overallScore: qualityReport.overallScore,
        issues: qualityReport.issues,
        recommendations: qualityReport.recommendations,
        passed: qualityReport.passed,
        createdAt: new Date(),
      },
    });
  }

  /**
   * Extrait les zones du design
   */
  private extractZonesFromDesign(design: any): any[] {
    if (!design.optionsJson?.zones) return [];
    return Object.entries(design.optionsJson.zones).map(([id, data]) => ({
      id,
      ...data,
    }));
  }

  /**
   * Génère les points de contrôle qualité
   */
  private generateQualityCheckpoints(design: any, product: any): string[] {
    return [
      'Material verification',
      'Dimensional accuracy',
      'Color matching',
      'Surface finish',
      'Assembly integrity',
    ];
  }

  /**
   * Calcule les tolérances
   */
  private calculateTolerances(product: any, options: any): Record<string, number> {
    return {
      dimensions: options.qualityLevel === 'premium' ? 0.1 : 0.2,
      color: options.qualityLevel === 'premium' ? 5 : 10,
      finish: options.qualityLevel === 'premium' ? 1 : 2,
    };
  }

  /**
   * Génère les exigences d'emballage
   */
  private generatePackagingRequirements(product: any, quantity: number): string[] {
    return [
      'Protective wrapping',
      'Branded packaging',
      quantity > 10 ? 'Bulk packaging' : 'Individual packaging',
    ];
  }

  /**
   * Génère les exigences d'étiquetage
   */
  private generateLabelingRequirements(orderId: string, product: any, design: any): string[] {
    return [
      'Order ID',
      'Product SKU',
      'Design reference',
      'Brand information',
    ];
  }

  /**
   * Crée le document d'instructions
   */
  private async createInstructionsDocument(instructions: any): Promise<Buffer> {
    // Simulation de création de document
    // En production, utiliser une librairie comme PDFKit
    const document = JSON.stringify(instructions, null, 2);
    return Buffer.from(document);
  }

  /**
   * Upload les instructions
   */
  private async uploadInstructions(instructionsBuffer: Buffer, orderId: string): Promise<string> {
    const filename = `instructions/${orderId}/manufacturing-instructions.json`;

    const uploadResult = await this.s3Service.uploadBuffer(
      instructionsBuffer,
      filename,
      {
        contentType: 'application/json',
        metadata: {
          orderId,
          type: 'manufacturing-instructions',
        },
      }
    );

    return uploadResult.url;
  }

  /**
   * Sauvegarde la référence des instructions
   */
  private async saveInstructionsReference(orderId: string, instructionsUrl: string): Promise<void> {
    await this.prisma.order.update({
      where: { id: orderId },
      data: {
        metadata: {
          manufacturingInstructionsUrl: instructionsUrl,
        },
      },
    });
  }
}


