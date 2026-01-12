import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/libs/prisma/prisma.service';
import * as ExcelJS from 'exceljs';
import * as PDFDocument from 'pdfkit';
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
    const { startDate, endDate, brandId, includeCharts } = options;

    // Create PDF document
    const doc = new PDFDocument({ margin: 50 });
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="analytics-${brandId}-${Date.now()}.pdf"`,
    );

    doc.pipe(res);

    // Header
    doc.fontSize(20).text('Rapport Analytics', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Période: ${startDate?.toLocaleDateString()} - ${endDate?.toLocaleDateString()}`);
    doc.moveDown();

    // Get analytics data
    const orders = await this.prisma.order.findMany({
      where: {
        brandId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: true,
      },
    });

    const designs = await this.prisma.design.findMany({
      where: {
        brandId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // Summary statistics
    doc.fontSize(16).text('Résumé', { underline: true });
    doc.moveDown();
    doc.fontSize(12);
    doc.text(`Total Commandes: ${orders.length}`);
    doc.text(`Total Designs: ${designs.length}`);
    doc.text(`Revenus: ${orders.reduce((sum, o) => sum + (o.totalCents / 100 || 0), 0).toFixed(2)}€`);
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
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF0071E3' },
      },
      alignment: { vertical: 'middle', horizontal: 'center' },
    };

    // Get analytics data
    const orders = await this.prisma.order.findMany({
      where: {
        brandId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      include: {
        items: true,
      },
    });

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
    summarySheet.addRow({
      metric: 'Revenus Total',
      value: orders.reduce((sum, o) => sum + (o.totalCents / 100 || 0), 0).toFixed(2) + '€',
    });
    summarySheet.addRow({
      metric: 'Période',
      value: `${startDate?.toLocaleDateString()} - ${endDate?.toLocaleDateString()}`,
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
        customer: order.userId.substring(0, 8),
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

    const orders = await this.prisma.order.findMany({
      where: {
        brandId,
        createdAt: {
          gte: startDate,
          lte: endDate,
        },
      },
    });

    // CSV header
    const csvRows = ['ID,Date,Montant,Statut,Client'];

    // CSV rows
    orders.forEach((order) => {
      csvRows.push(
        `${order.id.substring(0, 8)},${order.createdAt.toLocaleDateString()},${(order.totalCents / 100).toFixed(2)},${order.status},${order.userId.substring(0, 8)}`,
      );
    });

    const csv = csvRows.join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="analytics-${brandId}-${Date.now()}.csv"`,
    );
    res.send(csv);
  }
}
