/**
 * PDFExporter
 * Exports canvas to PDF using jsPDF
 */

import Konva from 'konva';
import jsPDF from 'jspdf';

export interface PDFExportOptions {
  format?: 'a4' | 'a3' | 'letter' | 'legal' | [number, number];
  orientation?: 'portrait' | 'landscape';
  margin?: number;
  title?: string;
  unit?: 'mm' | 'pt' | 'px' | 'in';
}

/**
 * Handles PDF export functionality
 */
export class PDFExporter {
  /**
   * Exports stage to PDF
   */
  static async exportToPDF(stage: Konva.Stage, options?: PDFExportOptions): Promise<jsPDF> {
    const opts: PDFExportOptions = {
      format: 'a4',
      orientation: 'portrait',
      margin: 10,
      unit: 'mm',
      ...options,
    };

    const stageWidth = stage.width();
    const stageHeight = stage.height();

    // Create PDF document
    const pdf = new jsPDF({
      orientation: opts.orientation,
      unit: opts.unit,
      format: opts.format,
    });

    // Get PDF dimensions
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();
    const margin = opts.margin || 10;
    const contentWidth = pdfWidth - margin * 2;
    const contentHeight = pdfHeight - margin * 2;

    // Calculate scale to fit content
    const scaleX = contentWidth / stageWidth;
    const scaleY = contentHeight / stageHeight;
    const scale = Math.min(scaleX, scaleY);

    const scaledWidth = stageWidth * scale;
    const scaledHeight = stageHeight * scale;

    // Center content
    const x = (pdfWidth - scaledWidth) / 2;
    const y = (pdfHeight - scaledHeight) / 2;

    // Export stage to image
    const dataURL = stage.toDataURL({
      pixelRatio: 2, // Higher quality
    });

    // Add title if provided
    if (opts.title) {
      pdf.setFontSize(16);
      pdf.text(opts.title, margin, margin);
      pdf.addImage(dataURL, 'PNG', x, y + (opts.title ? 10 : 0), scaledWidth, scaledHeight);
    } else {
      pdf.addImage(dataURL, 'PNG', x, y, scaledWidth, scaledHeight);
    }

    return pdf;
  }

  /**
   * Downloads PDF document
   */
  static downloadPDF(doc: jsPDF, filename: string = 'export.pdf'): void {
    doc.save(filename);
  }

  /**
   * Adds a new page with stage content
   */
  static addPage(doc: jsPDF, stage: Konva.Stage, viewName?: string): void {
    doc.addPage();

    const pdfWidth = doc.internal.pageSize.getWidth();
    const pdfHeight = doc.internal.pageSize.getHeight();
    const margin = 10;
    const contentWidth = pdfWidth - margin * 2;
    const contentHeight = pdfHeight - margin * 2;

    const stageWidth = stage.width();
    const stageHeight = stage.height();

    const scaleX = contentWidth / stageWidth;
    const scaleY = contentHeight / stageHeight;
    const scale = Math.min(scaleX, scaleY);

    const scaledWidth = stageWidth * scale;
    const scaledHeight = stageHeight * scale;

    const x = (pdfWidth - scaledWidth) / 2;
    const y = (pdfHeight - scaledHeight) / 2;

    const dataURL = stage.toDataURL({
      pixelRatio: 2,
    });

    if (viewName) {
      doc.setFontSize(12);
      doc.text(viewName, margin, margin);
      doc.addImage(dataURL, 'PNG', x, y + 10, scaledWidth, scaledHeight);
    } else {
      doc.addImage(dataURL, 'PNG', x, y, scaledWidth, scaledHeight);
    }
  }

  /**
   * Exports and downloads stage as PDF
   */
  static async exportAndDownload(
    stage: Konva.Stage,
    filename: string = 'export.pdf',
    options?: PDFExportOptions
  ): Promise<void> {
    const pdf = await this.exportToPDF(stage, options);
    this.downloadPDF(pdf, filename);
  }
}
