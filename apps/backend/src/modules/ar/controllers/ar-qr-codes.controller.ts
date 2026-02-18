/**
 * AR Studio - QR Codes Controller
 * CRUD, download PNG/SVG/PDF, analytics
 */

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Param,
  Query,
  Body,
  Res,
  UseGuards,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { Response } from 'express';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { JwtAuthGuard } from '@/common/guards/jwt-auth.guard';
import { ARPlanGuard } from '@/common/guards/ar-plan.guard';
import { User } from '@/common/decorators/user.decorator';
import { CurrentUser } from '@/common/types/user.types';
import { PrismaService } from '@/libs/prisma/prisma.service';
import { StorageService } from '@/libs/storage/storage.service';
import { QrGeneratorService } from '../qr-codes/qr-generator.service';
import { QrCustomizerService } from '../qr-codes/qr-customizer.service';
import { QrAnalyticsService } from '../qr-codes/qr-analytics.service';
import { DynamicLinkService } from '../qr-codes/dynamic-link.service';
import { CreateQRCodeDto, UpdateQRCodeDto } from '../dto/ar-qr-codes.dto';
import { QRCodeType } from '@prisma/client';

@ApiTags('AR Studio - QR Codes')
@Controller('ar-studio/qr-codes')
@UseGuards(JwtAuthGuard, ARPlanGuard)
@Throttle({ default: { limit: 30, ttl: 60000 } })
export class ArQrCodesController {
  private readonly logger = new Logger(ArQrCodesController.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
    private readonly qrGenerator: QrGeneratorService,
    private readonly qrCustomizer: QrCustomizerService,
    private readonly qrAnalytics: QrAnalyticsService,
    private readonly dynamicLink: DynamicLinkService,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create QR code' })
  async create(@User() user: CurrentUser, @Body() dto: CreateQRCodeDto) {
    const brandId = user.brandId ?? '';
    const { shortCode, qrCodeId } = await this.dynamicLink.createShortLink({
      projectId: dto.projectId,
      brandId,
      targetUrl: dto.targetURL,
      type: dto.type,
      name: dto.name,
      description: dto.description,
    });

    const baseUrl = process.env.APP_URL ?? 'https://app.luneo.io';
    const viewUrl = `${baseUrl}/ar/view/${shortCode}`;

    const qr = await this.prisma.aRQRCode.update({
      where: { id: qrCodeId },
      data: {
        name: dto.name,
        description: dto.description ?? undefined,
        foregroundColor: dto.foregroundColor ?? '#000000',
        backgroundColor: dto.backgroundColor ?? '#FFFFFF',
        style: dto.style ?? 'squares',
        size: dto.size ?? 300,
        errorCorrection: dto.errorCorrection ?? 'M',
        logoURL: dto.logoURL ?? undefined,
        tags: dto.tags ?? [],
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
      include: { project: { select: { id: true, name: true } } },
    });

    return { ...qr, shortCode, viewUrl };
  }

  @Get()
  @ApiOperation({ summary: 'List QR codes for project' })
  async list(
    @User() user: CurrentUser,
    @Query('projectId') projectId: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    const brandId = user.brandId ?? '';
    const project = await this.prisma.aRProject.findFirst({
      where: { id: projectId, brandId },
    });
    if (!project) {
      return { qrCodes: [], pagination: { total: 0, limit: 20, offset: 0, totalPages: 0 } };
    }
    const take = Math.min(parseInt(limit ?? '20', 10), 100);
    const skip = parseInt(offset ?? '0', 10);
    const [qrCodes, total] = await Promise.all([
      this.prisma.aRQRCode.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        take,
        skip,
      }),
      this.prisma.aRQRCode.count({ where: { projectId } }),
    ]);
    return {
      qrCodes,
      pagination: { total, limit: take, offset: skip, totalPages: Math.ceil(total / take) },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get QR code detail' })
  async getOne(@User() user: CurrentUser, @Param('id') id: string) {
    const brandId = user.brandId ?? '';
    const qr = await this.prisma.aRQRCode.findFirst({
      where: { id, project: { brandId } },
      include: { project: { select: { id: true, name: true } } },
    });
    if (!qr) throw new NotFoundException('QR code not found');
    return qr;
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update QR code' })
  async update(@User() user: CurrentUser, @Param('id') id: string, @Body() dto: UpdateQRCodeDto) {
    const brandId = user.brandId ?? '';
    const existing = await this.prisma.aRQRCode.findFirst({
      where: { id, project: { brandId } },
    });
    if (!existing) throw new NotFoundException('QR code not found');

    const updated = await this.prisma.aRQRCode.update({
      where: { id },
      data: {
        ...(dto.targetURL != null && { targetURL: dto.targetURL }),
        ...(dto.name != null && { name: dto.name }),
        ...(dto.description !== undefined && { description: dto.description }),
        ...(dto.logoURL !== undefined && { logoURL: dto.logoURL }),
        ...(dto.foregroundColor != null && { foregroundColor: dto.foregroundColor }),
        ...(dto.backgroundColor != null && { backgroundColor: dto.backgroundColor }),
        ...(dto.style != null && { style: dto.style }),
        ...(dto.size != null && { size: dto.size }),
        ...(dto.errorCorrection != null && { errorCorrection: dto.errorCorrection }),
        ...(dto.tags != null && { tags: dto.tags }),
        ...(dto.expiresAt !== undefined && { expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
      },
    });
    return updated;
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete QR code' })
  async delete(@User() user: CurrentUser, @Param('id') id: string) {
    const brandId = user.brandId ?? '';
    const existing = await this.prisma.aRQRCode.findFirst({
      where: { id, project: { brandId } },
    });
    if (!existing) throw new NotFoundException('QR code not found');
    await this.prisma.aRQRCode.delete({ where: { id } });
    this.logger.log(`Deleted QR code ${id}`);
    return { ok: true };
  }

  @Get(':id/download/:format')
  @ApiOperation({ summary: 'Download QR as PNG, SVG, or PDF' })
  async download(
    @User() user: CurrentUser,
    @Param('id') id: string,
    @Param('format') format: 'png' | 'svg' | 'pdf',
    @Res() res: Response,
  ) {
    const brandId = user.brandId ?? '';
    const qr = await this.prisma.aRQRCode.findFirst({
      where: { id, project: { brandId } },
    });
    if (!qr) throw new NotFoundException('QR code not found');

    const baseUrl = process.env.APP_URL ?? 'https://app.luneo.io';
    const viewUrl = `${baseUrl}/ar/view/${qr.shortCode}`;

    if (format === 'svg') {
      const buffer = await this.qrCustomizer.generateStyledQR(
        viewUrl,
        {
          size: qr.size,
          foregroundColor: qr.foregroundColor,
          backgroundColor: qr.backgroundColor,
          style: qr.style as 'squares' | 'dots' | 'rounded',
          errorCorrectionLevel: (qr.errorCorrection as 'L' | 'M' | 'Q' | 'H') ?? 'M',
        },
        'svg',
      );
      res.setHeader('Content-Type', 'image/svg+xml');
      res.setHeader('Content-Disposition', `attachment; filename="qr-${qr.shortCode}.svg"`);
      res.send(buffer);
      return;
    }

    if (format === 'png') {
      const buffer = await this.qrCustomizer.generateStyledQR(viewUrl, {
        size: qr.size,
        foregroundColor: qr.foregroundColor,
        backgroundColor: qr.backgroundColor,
        style: qr.style as 'squares' | 'dots' | 'rounded',
        errorCorrectionLevel: (qr.errorCorrection as 'L' | 'M' | 'Q' | 'H') ?? 'M',
      });
      res.setHeader('Content-Type', 'image/png');
      res.setHeader('Content-Disposition', `attachment; filename="qr-${qr.shortCode}.png"`);
      res.send(buffer);
      return;
    }

    if (format === 'pdf') {
      const buffer = await this.qrGenerator.generatePNG(viewUrl, qr.size, (qr.errorCorrection as 'L' | 'M' | 'Q' | 'H') ?? 'M');
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="qr-${qr.shortCode}.pdf"`);
      const PDFDocument = await import('pdfkit');
      const doc = new PDFDocument.default({ size: 'A4' });
      doc.pipe(res);
      doc.image(buffer, 50, 50, { width: 200 });
      doc.end();
      return;
    }

    throw new NotFoundException('Format must be png, svg, or pdf');
  }

  @Get(':id/analytics')
  @ApiOperation({ summary: 'Detailed analytics for QR code' })
  async analytics(@User() user: CurrentUser, @Param('id') id: string) {
    const brandId = user.brandId ?? '';
    return this.qrAnalytics.getScanAnalytics(id, brandId);
  }
}
