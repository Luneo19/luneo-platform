import { Injectable, Logger, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';
import { SvgGeneratorService, SpecData } from './svg-generator.service';
import { DxfGeneratorService } from './dxf-generator.service';
import { PdfGeneratorService } from './pdf-generator.service';
import * as archiver from 'archiver'; // ✅ archiver package installed

export interface ExportPackOptions {
  formats?: ('svg' | 'dxf' | 'pdf')[];
  includeMetadata?: boolean;
  compression?: 'none' | 'zip';
}

@Injectable()
export class ExportPackService {
  private readonly logger = new Logger(ExportPackService.name);

  constructor(
    private prisma: PrismaService,
    private storage: StorageService,
    private svgGenerator: SvgGeneratorService,
    private dxfGenerator: DxfGeneratorService,
    private pdfGenerator: PdfGeneratorService,
  ) {}

  /**
   * Générer un pack d'export pour un snapshot
   */
  async generateExportPack(
    snapshotId: string,
    options: ExportPackOptions = {},
  ): Promise<{ url: string; formats: string[]; size: number }> {
    const { formats = ['svg', 'dxf', 'pdf'], includeMetadata = true, compression = 'zip' } = options;

    // Récupérer le snapshot
    const snapshot = await this.prisma.snapshot.findUnique({
      where: { id: snapshotId },
      include: {
        spec: {
          include: {
            product: true,
          },
        },
      },
    });

    if (!snapshot) {
      throw new NotFoundException(`Snapshot not found: ${snapshotId}`);
    }

    // Générer les fichiers pour chaque format
    const files: Array<{ name: string; content: Buffer; format: string }> = [];

    for (const format of formats) {
      try {
        let content: Buffer;

        switch (format) {
          case 'svg':
            content = await this.svgGenerator.generate({ specData: snapshot.specData as SpecData });
            break;
          case 'dxf':
            content = await this.dxfGenerator.generate({ specData: snapshot.specData as SpecData, id: snapshot.id });
            break;
          case 'pdf':
            content = await this.pdfGenerator.generate({ specData: snapshot.specData as Record<string, unknown>, id: snapshot.id });
            break;
          default:
            this.logger.warn(`Unsupported format: ${format}`);
            continue;
        }

        files.push({
          name: `design.${format}`,
          content,
          format,
        });
      } catch (error) {
        this.logger.error(`Failed to generate ${format} for snapshot ${snapshotId}`, error);
        // Continuer avec les autres formats
      }
    }

    if (files.length === 0) {
      throw new InternalServerErrorException('No files generated');
    }

    // Ajouter metadata si demandé
    if (includeMetadata) {
      const metadata = {
        snapshotId: snapshot.id,
        specHash: snapshot.specHash,
        productId: snapshot.spec.productId,
        productName: snapshot.spec.product.name,
        createdAt: snapshot.createdAt.toISOString(),
        formats: files.map(f => f.format),
      };

      files.push({
        name: 'metadata.json',
        content: Buffer.from(JSON.stringify(metadata, null, 2)),
        format: 'json',
      });
    }

    // Créer le ZIP
    if (compression === 'zip') {
      const zipBuffer = await this.createZip(files);
      const zipUrl = await this.storage.uploadFile(
        `manufacturing/packs/${snapshotId}/export-pack-${snapshotId}.zip`,
        zipBuffer,
        'application/zip',
        'manufacturing/packs',
      );

      // Mettre à jour le snapshot avec productionBundleUrl
      await this.prisma.snapshot.update({
        where: { id: snapshotId },
        data: {
          productionBundleUrl: zipUrl,
        },
      });

      return {
        url: zipUrl,
        formats: files.map(f => f.format),
        size: zipBuffer.length,
      };
    } else {
      // Si pas de compression, uploader les fichiers individuellement
      // Pour l'instant, retourner juste le premier fichier
      const firstFile = files[0];
      const contentType = firstFile.format === 'svg' ? 'image/svg+xml' : 
                         firstFile.format === 'pdf' ? 'application/pdf' : 
                         'application/octet-stream';
      const url = await this.storage.uploadFile(
        `manufacturing/packs/${snapshotId}/${firstFile.name}`,
        firstFile.content,
        contentType,
        'manufacturing/packs',
      );

      return {
        url,
        formats: [firstFile.format],
        size: firstFile.content.length,
      };
    }
  }

  /**
   * Créer un ZIP depuis une liste de fichiers
   */
  private async createZip(
    files: Array<{ name: string; content: Buffer }>,
  ): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const archive = archiver('zip', {
        zlib: { level: 9 }, // Compression maximale
      });

      const chunks: Buffer[] = [];

      archive.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      archive.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      archive.on('error', (error) => {
        reject(error);
      });

      // Ajouter les fichiers
      for (const file of files) {
        archive.append(file.content, { name: file.name });
      }

      archive.finalize();
    });
  }
}

