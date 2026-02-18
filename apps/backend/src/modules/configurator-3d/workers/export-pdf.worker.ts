/**
 * Configurator 3D - PDF Export Worker
 * BullMQ worker for generating PDF exports from 3D configurations
 */

import { Processor, Process, OnQueueFailed } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ExportStatus } from '@prisma/client';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';

export interface GeneratePdfJobData {
  exportId: string;
  sessionId: string | null;
  configurationId: string;
  selections?: Record<string, unknown>;
  options?: Record<string, unknown>;
}

@Processor('configurator-3d-export-pdf')
export class ExportPdfWorker {
  private readonly logger = new Logger(ExportPdfWorker.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
    private readonly eventEmitter: EventEmitter2,
  ) {}

  @Process('generate-pdf')
  @Process('export-pdf')
  async handleGeneratePdf(job: Job<GeneratePdfJobData>): Promise<void> {
    const { exportId, sessionId, configurationId, selections, options } =
      job.data;

    this.logger.log(`Processing PDF export ${exportId} for configuration ${configurationId}`);

    try {
      await this.prisma.configurator3DExport.update({
        where: { id: exportId },
        data: { status: ExportStatus.PROCESSING, progress: 10 },
      });

      const configuration =
        await this.prisma.configurator3DConfiguration.findUnique({
          where: { id: configurationId },
          include: {
            components: {
              where: { isEnabled: true },
              orderBy: { sortOrder: 'asc' },
              include: {
                options: {
                  where: { isEnabled: true, isVisible: true },
                  orderBy: { sortOrder: 'asc' },
                },
              },
            },
          },
        });

      if (!configuration) {
        throw new Error(`Configuration ${configurationId} not found`);
      }

      let sessionData: {
        selections?: unknown;
        calculatedPrice?: number | null;
        priceBreakdown?: unknown;
        currency?: string;
      } | null = null;

      if (sessionId) {
        sessionData = await this.prisma.configurator3DSession.findUnique({
          where: { id: sessionId },
          select: {
            selections: true,
            calculatedPrice: true,
            priceBreakdown: true,
            currency: true,
          },
        });
      }

      const effectiveSelections =
        (selections as Record<string, unknown>) ??
        (sessionData?.selections as Record<string, unknown>) ??
        {};
      const finalPrice =
        sessionData?.calculatedPrice ?? configuration.pricingSettings
          ? (configuration.pricingSettings as { basePrice?: number })?.basePrice ?? 0
          : 0;
      const currency = sessionData?.currency ?? 'EUR';

      await this.prisma.configurator3DExport.update({
        where: { id: exportId },
        data: { progress: 30 },
      });

      const html = this.buildHtmlContent({
        configuration,
        selections: effectiveSelections,
        priceBreakdown: sessionData?.priceBreakdown as Record<string, unknown> | undefined,
        finalPrice,
        currency,
        options: options ?? {},
      });

      await this.prisma.configurator3DExport.update({
        where: { id: exportId },
        data: { progress: 60 },
      });

      const buffer = Buffer.from(html, 'utf-8');
      const fileName = `configurator-export-${exportId}.html`;
      const key = `configurator-3d/exports/${exportId}/${fileName}`;

      const fileUrl = await this.storageService.uploadFile(
        key,
        buffer,
        'text/html; charset=utf-8',
        'luneo-assets',
        configuration.brandId,
      );

      const fileSize = buffer.length;

      await this.prisma.configurator3DExport.update({
        where: { id: exportId },
        data: {
          status: ExportStatus.COMPLETED,
          fileUrl,
          fileName,
          fileSize,
          progress: 100,
          completedAt: new Date(),
          errorMessage: null,
        },
      });

      this.eventEmitter.emit('configurator-3d.export.completed', {
        exportId,
        configurationId,
        sessionId,
        type: 'PDF',
        fileUrl,
        fileName,
        fileSize,
      });

      this.logger.log(`PDF export ${exportId} completed successfully`);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      this.logger.error(`PDF export ${exportId} failed: ${errorMsg}`);

      await this.prisma.configurator3DExport.update({
        where: { id: exportId },
        data: {
          status: ExportStatus.FAILED,
          errorMessage: errorMsg,
          completedAt: new Date(),
        },
      });

      throw error;
    }
  }

  private buildHtmlContent(params: {
    configuration: {
      name: string;
      description?: string | null;
      thumbnailUrl?: string | null;
      components: Array<{
        id: string;
        name: string;
        options: Array<{
          id: string;
          name: string;
          label?: string | null;
          previewImageUrl?: string | null;
          priceDelta?: number;
        }>;
      }>;
    };
    selections: Record<string, unknown>;
    priceBreakdown?: Record<string, unknown>;
    finalPrice: number;
    currency: string;
    options: Record<string, unknown>;
  }): string {
    const {
      configuration,
      selections,
      priceBreakdown,
      finalPrice,
      currency,
    } = params;

    const selectedOptionsHtml = configuration.components
      .map((comp) => {
        const selected = Object.entries(selections).find(
          ([k]) => k === comp.id || k === comp.name,
        );
        const optionId = selected?.[0];
        const optionValue = selected?.[1];
        if (!optionId || optionValue == null) return null;
        const opt = comp.options.find(
          (o) => o.id === optionValue || o.name === optionValue,
        );
        if (!opt) return null;
        return `
          <tr>
            <td>${comp.name}</td>
            <td>${opt.label ?? opt.name}</td>
            <td>${opt.priceDelta ?? 0} ${currency}</td>
          </tr>
        `;
      })
      .filter(Boolean)
      .join('');

    const priceBreakdownHtml = priceBreakdown
      ? `<pre>${JSON.stringify(priceBreakdown, null, 2)}</pre>`
      : '';

    return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${configuration.name} - Configuration Export</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; }
    h1 { color: #333; }
    table { width: 100%; border-collapse: collapse; margin: 1rem 0; }
    th, td { border: 1px solid #ddd; padding: 0.5rem 1rem; text-align: left; }
    th { background: #f5f5f5; }
    .total { font-size: 1.25rem; font-weight: bold; margin-top: 1rem; }
    img { max-width: 200px; height: auto; }
    .note { font-size: 0.875rem; color: #666; margin-top: 2rem; }
  </style>
</head>
<body>
  <h1>${configuration.name}</h1>
  ${configuration.description ? `<p>${configuration.description}</p>` : ''}
  ${configuration.thumbnailUrl ? `<img src="${configuration.thumbnailUrl}" alt="Preview" />` : ''}

  <h2>Selected Options</h2>
  <table>
    <thead><tr><th>Component</th><th>Option</th><th>Price Delta</th></tr></thead>
    <tbody>${selectedOptionsHtml || '<tr><td colspan="3">No selections</td></tr>'}</tbody>
  </table>

  ${priceBreakdownHtml ? `<h2>Price Breakdown</h2>${priceBreakdownHtml}` : ''}

  <div class="total">Total: ${finalPrice.toFixed(2)} ${currency}</div>

  <p class="note">Generated from 3D Configurator. In production, this would be rendered as PDF via pdfkit/puppeteer.</p>
</body>
</html>
    `.trim();
  }

  @OnQueueFailed()
  onFailed(job: Job, error: Error): void {
    this.logger.error(
      `PDF export job ${job.id} failed: ${error.message}`,
      error.stack,
    );
  }
}
