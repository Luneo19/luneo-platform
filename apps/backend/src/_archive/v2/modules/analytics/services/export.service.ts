import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import * as ExcelJS from 'exceljs';
// eslint-disable-next-line @typescript-eslint/no-var-requires
const PDFDocument = require('pdfkit');
import { Response } from 'express';

export interface ExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  startDate?: Date;
  endDate?: Date;
  brandId: string;
  includeCharts?: boolean;
}

@Injectable()
export class AnalyticsExportService {
  private readonly logger = new Logger(AnalyticsExportService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Export analytics data to PDF
   */
  async exportToPDF(options: ExportOptions, res: Response): Promise<void> {
    const { startDate, endDate, brandId, includeCharts: _includeCharts } = options;

    const PDFDoc = PDFDocument as new (opts?: Record<string, unknown>) => {
      pipe: (res: Response) => void;
      fontSize: (n: number) => { text: (s: string, opts?: Record<string, unknown>) => void };
      moveDown: (n?: number) => void;
      text: (s: string, opts?: Record<string, unknown>) => void;
      end: () => void;
    };
    const doc = new PDFDoc({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="analytics-${brandId}-${Date.now()}.pdf"`,
    );

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('Rapport Analytics Luneo', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Période: ${startDate?.toLocaleDateString('fr-FR') || 'Toutes'} - ${endDate?.toLocaleDateString('fr-FR') || 'Aujourd\'hui'}`);
    doc.moveDown();
    doc.fontSize(10).text(`Généré le ${new Date().toLocaleString('fr-FR')}`, { align: 'center' });
    doc.moveDown(2);

    // Get analytics data
    const [orders, designs, users, renders] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          brandId,
          createdAt: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
          },
        },
        include: {
          items: true,
        },
      }),
      this.prisma.design.findMany({
        where: {
          brandId,
          createdAt: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
          },
        },
      }),
      this.prisma.user.count({
        where: {
          brandId,
          createdAt: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
          },
        },
      }),
      this.prisma.design.count({
        where: {
          brandId,
          renderUrl: { not: null },
          createdAt: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
          },
        },
      }),
    ]);

    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalCents / 100 || 0), 0);
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    // Summary statistics
    doc.fontSize(16).text('Résumé Exécutif', { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Total Commandes: ${orders.length}`);
    doc.text(`Total Designs: ${designs.length}`);
    doc.text(`Total Renders: ${renders}`);
    doc.text(`Nouveaux Utilisateurs: ${users}`);
    doc.text(`Revenus Total: ${totalRevenue.toFixed(2)}€`);
    doc.text(`Panier Moyen: ${avgOrderValue.toFixed(2)}€`);
    doc.moveDown();

    // Orders table
    doc.fontSize(14).text('Commandes', { underline: true });
    doc.moveDown();
    
    orders.slice(0, 20).forEach((order, index) => {
      doc.fontSize(10);
      doc.text(`${index + 1}. Commande #${order.id.substring(0, 8)}`);
      doc.text(`   Date: ${order.createdAt.toLocaleDateString()}`);
      doc.text(`   Montant: ${(order.totalCents / 100).toFixed(2)}€`);
      doc.text(`   Statut: ${order.status}`);
      doc.moveDown(0.5);
    });

    // Footer
    doc.fontSize(8).text(
      `Généré le ${new Date().toLocaleString()}`,
      { align: 'center' },
    );

    doc.end();
  }

  /**
   * Export analytics data to Excel
   */
  async exportToExcel(options: ExportOptions, res: Response): Promise<void> {
    const { startDate, endDate, brandId } = options;

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Analytics');

    // Header style
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFFFF' } },
      fill: {
        type: 'pattern' as const,
        pattern: 'solid' as const,
        fgColor: { argb: 'FF0071E3' },
      },
      alignment: { vertical: 'middle' as const, horizontal: 'center' as const },
    };

    // Get analytics data
    const [orders, designs, users, renders] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          brandId,
          createdAt: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
          },
        },
        include: {
          items: true,
        },
      }),
      this.prisma.design.findMany({
        where: {
          brandId,
          createdAt: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
          },
        },
      }),
      this.prisma.user.count({
        where: {
          brandId,
          createdAt: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
          },
        },
      }),
      this.prisma.design.count({
        where: {
          brandId,
          renderUrl: { not: null },
          createdAt: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
          },
        },
      }),
    ]);

    const totalRevenue = orders.reduce((sum, o) => sum + (o.totalCents / 100 || 0), 0);
    const avgOrderValue = orders.length > 0 ? totalRevenue / orders.length : 0;

    // Summary sheet
    const summarySheet = workbook.addWorksheet('Résumé');
    summarySheet.columns = [
      { header: 'Métrique', key: 'metric', width: 30 },
      { header: 'Valeur', key: 'value', width: 20 },
    ];

    // Apply header style to each cell in the header row
    summarySheet.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });
    summarySheet.addRow({ metric: 'Total Commandes', value: orders.length });
    summarySheet.addRow({ metric: 'Total Designs', value: designs.length });
    summarySheet.addRow({ metric: 'Total Renders', value: renders });
    summarySheet.addRow({ metric: 'Nouveaux Utilisateurs', value: users });
    summarySheet.addRow({ metric: 'Revenus Total', value: totalRevenue.toFixed(2) + '€' });
    summarySheet.addRow({ metric: 'Panier Moyen', value: avgOrderValue.toFixed(2) + '€' });
    summarySheet.addRow({
      metric: 'Période',
      value: `${startDate?.toLocaleDateString('fr-FR') || 'Toutes'} - ${endDate?.toLocaleDateString('fr-FR') || 'Aujourd\'hui'}`,
    });

    // Orders sheet
    worksheet.columns = [
      { header: 'ID', key: 'id', width: 15 },
      { header: 'Date', key: 'date', width: 15 },
      { header: 'Montant', key: 'amount', width: 15 },
      { header: 'Statut', key: 'status', width: 15 },
      { header: 'Client', key: 'customer', width: 30 },
    ];

    // Apply header style to each cell in the header row
    worksheet.getRow(1).eachCell((cell) => {
      cell.style = headerStyle;
    });

    orders.forEach((order) => {
      worksheet.addRow({
        id: order.id.substring(0, 8),
        date: order.createdAt.toLocaleDateString(),
        amount: (order.totalCents / 100).toFixed(2) + '€',
        status: order.status,
        customer: (order.userId ?? '').substring(0, 8),
      });
    });

    // Set response headers
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    );
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="analytics-${brandId}-${Date.now()}.xlsx"`,
    );

    await workbook.xlsx.write(res);
    res.end();
  }

  /**
   * Export analytics data to CSV
   */
  async exportToCSV(options: ExportOptions, res: Response): Promise<void> {
    const { startDate, endDate, brandId } = options;

    const [orders, designs] = await Promise.all([
      this.prisma.order.findMany({
        where: {
          brandId,
          createdAt: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
          },
        },
      }),
      this.prisma.design.findMany({
        where: {
          brandId,
          createdAt: {
            ...(startDate && { gte: startDate }),
            ...(endDate && { lte: endDate }),
          },
        },
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    ]);

    // CSV header
    const csvRows = [
      '# Analytics Export - Luneo',
      `# Période: ${startDate?.toLocaleDateString('fr-FR') || 'Toutes'} - ${endDate?.toLocaleDateString('fr-FR') || 'Aujourd\'hui'}`,
      `# Généré le: ${new Date().toLocaleString('fr-FR')}`,
      '',
      '## Commandes',
      'ID,Date,Montant,Statut,Client',
    ];

    // CSV rows for orders
    orders.forEach((order) => {
      csvRows.push(
        `${order.id.substring(0, 8)},${order.createdAt.toLocaleDateString('fr-FR')},${(order.totalCents / 100).toFixed(2)},${order.status},${(order.userId ?? '').substring(0, 8)}`,
      );
    });

    // Add designs section
    csvRows.push('');
    csvRows.push('## Designs');
    csvRows.push('ID,Nom,Créé le,Modifié le');
    designs.forEach((design) => {
      csvRows.push(
        `${design.id.substring(0, 8)},${design.name || 'Sans nom'},${design.createdAt.toLocaleDateString('fr-FR')},${design.updatedAt.toLocaleDateString('fr-FR')}`,
      );
    });

    const csv = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="analytics-${brandId}-${Date.now()}.csv"`,
    );
    res.send(csv);
  }
}
