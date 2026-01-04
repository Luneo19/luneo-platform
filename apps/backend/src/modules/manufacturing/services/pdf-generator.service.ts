import { Injectable, Logger } from '@nestjs/common';
// Note: pdfkit package not installed - functionality disabled
// import * as PDFDocument from 'pdfkit';

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);

  /**
   * Générer un PDF depuis un snapshot
   */
  async generate(snapshot: any): Promise<Buffer> {
    // TODO: Install pdfkit package to enable PDF generation
    this.logger.warn('PDF generation not available - pdfkit package not installed');
    return Buffer.from('');
    /*
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
      });

      const chunks: Buffer[] = [];

      doc.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
      });

      doc.on('end', () => {
        resolve(Buffer.concat(chunks));
      });

      doc.on('error', (error) => {
        reject(error);
      });

      // Ajouter le contenu
      const specData = snapshot.specData as any;
      const productName = specData?.productName || 'Design';
      const zones = specData?.zones || [];

      // Titre
      doc.fontSize(20).text(productName, { align: 'center' });
      doc.moveDown();

      // Ajouter les zones
      for (const zone of zones) {
        if (zone.input && zone.input.text) {
          doc.fontSize(zone.input.size || 12);
          doc.text(zone.input.text);
          doc.moveDown();
        }
      }

      // Finaliser
      doc.end();
    });
    */
  }
}







