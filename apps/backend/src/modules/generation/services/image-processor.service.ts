import { Injectable, Logger } from '@nestjs/common';
import { StorageService } from '@/libs/storage/storage.service';
import sharp from 'sharp';

interface ComposeParams {
  baseImage: Buffer;
  generatedOverlay: Buffer;
  customizationZones: Array<{
    id: string;
    positionX: number;
    positionY: number;
    width: number;
    height: number;
  }>;
  customizations: Record<string, any>;
  outputFormat: string;
}

@Injectable()
export class ImageProcessorService {
  private readonly logger = new Logger(ImageProcessorService.name);

  constructor(private readonly storage: StorageService) {}

  /**
   * Compose l'image finale en combinant l'image de base avec les overlays générés
   */
  async compose(params: ComposeParams): Promise<Buffer> {
    const { baseImage, generatedOverlay, customizationZones, customizations, outputFormat } = params;

    try {
      // Pour l'instant, on retourne l'image générée directement
      // TODO: Implémenter la composition réelle avec les zones de personnalisation
      // Cela nécessiterait de:
      // 1. Charger l'image de base
      // 2. Appliquer les overlays aux positions des zones
      // 3. Fusionner avec les effets (engraved, embossed, etc.)
      
      this.logger.log('Composing final image...');

      // Utiliser sharp pour le traitement d'image
      const composed = await sharp(generatedOverlay)
        .toFormat(outputFormat as any)
        .toBuffer();

      return composed;
    } catch (error) {
      this.logger.error(`Image composition failed: ${error.message}`);
      throw new Error(`Failed to compose image: ${error.message}`);
    }
  }

  /**
   * Crée une miniature de l'image
   */
  async createThumbnail(image: Buffer, width: number = 300, height: number = 300): Promise<Buffer> {
    try {
      return await sharp(image)
        .resize(width, height, {
          fit: 'inside',
          withoutEnlargement: true,
        })
        .jpeg({ quality: 85 })
        .toBuffer();
    } catch (error) {
      this.logger.error(`Thumbnail creation failed: ${error.message}`);
      throw new Error(`Failed to create thumbnail: ${error.message}`);
    }
  }

  /**
   * Upload une image vers le stockage
   */
  async uploadImage(buffer: Buffer, key: string, contentType: string): Promise<string> {
    return this.storage.uploadBuffer(buffer, key, {
      contentType,
      bucket: 'generations',
    });
  }
}



