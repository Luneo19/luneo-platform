import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CustomizationService {
  private readonly logger = new Logger(CustomizationService.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Génère une personnalisation pour un produit
   */
  async generateCustomization(body: {
    productId: string;
    zoneId: string;
    prompt: string;
    font?: string;
    color?: string;
    size?: number;
    effect?: 'normal' | 'embossed' | 'engraved' | '3d';
    zoneUV: { u: number[]; v: number[] };
    modelUrl: string;
  }): Promise<any> {
    try {
      this.logger.log(`Starting customization generation for product ${body.productId}, zone ${body.zoneId}`);

      // Appeler le moteur IA Python externe
      const aiEngineUrl = this.configService.get<string>('ai.engineUrl') || process.env.AI_ENGINE_URL || 'http://localhost:8000';

      const response = await fetch(`${aiEngineUrl}/api/generate/texture`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: body.prompt,
          font: body.font || 'Arial',
          color: body.color || '#000000',
          size: body.size || 24,
          effect: body.effect || 'engraved',
          zoneUV: body.zoneUV,
          modelUrl: body.modelUrl,
          productId: body.productId,
          zoneId: body.zoneId,
        }),
        signal: AbortSignal.timeout(30000), // 30s timeout
      });

      if (!response.ok) {
        const errorText = await response.text();
        this.logger.error('AI Engine error', { status: response.status, error: errorText });
        throw new InternalServerErrorException(`AI Engine error: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      this.logger.log('Customization generated', {
        jobId: data.jobId,
        textureUrl: data.textureUrl,
      });

      return data;
    } catch (error: any) {
      this.logger.error('Error calling AI engine', { error: error.message });

      // Retry logic (simple, peut être amélioré)
      if (error.name === 'AbortError' || error.message.includes('timeout')) {
        throw new InternalServerErrorException('La génération a pris trop de temps. Veuillez réessayer.');
      }

      throw new InternalServerErrorException(`Erreur lors de la génération: ${error.message}`);
    }
  }
}
