import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class PdfGeneratorService {
  private readonly logger = new Logger(PdfGeneratorService.name);

  /**
   * Générer un PDF depuis un snapshot
   * Implémentation basique sans dépendance externe (format PDF brut)
   */
  async generate(snapshot: any): Promise<Buffer> {
    try {
      const specData = snapshot.specData as Record<string, unknown> | null | undefined;
      const productName = specData?.productName || 'Design';
      const zones = specData?.zones || [];
      const snapshotId = snapshot.id || 'unknown';

      // Construire le contenu texte du PDF
      const lines: string[] = [
        `Luneo Manufacturing Spec - ${productName}`,
        `Snapshot ID: ${snapshotId}`,
        `Generated: ${new Date().toISOString()}`,
        '',
        '--- Specifications ---',
        '',
      ];

      if (specData?.dimensions) {
        lines.push(`Dimensions: ${specData.dimensions.width || 0}mm x ${specData.dimensions.height || 0}mm`);
        lines.push('');
      }

      for (const zone of zones) {
        lines.push(`Zone: ${zone.name || zone.type || 'unnamed'}`);
        if (zone.input?.text) {
          lines.push(`  Text: ${zone.input.text}`);
          lines.push(`  Font: ${zone.input.font || 'Arial'} ${zone.input.size || 12}pt`);
          lines.push(`  Color: ${zone.input.color || '#000000'}`);
        }
        if (zone.input?.imageUrl) {
          lines.push(`  Image: ${zone.input.imageUrl}`);
        }
        lines.push('');
      }

      // Générer un PDF brut minimal (conforme à la spec PDF 1.4)
      const content = lines.join('\n');
      const pdf = this.buildMinimalPdf(content, productName);
      
      this.logger.log(`PDF generated for snapshot ${snapshotId}: ${pdf.length} bytes`);
      return pdf;
    } catch (error) {
      this.logger.error('PDF generation failed', error);
      throw error;
    }
  }

  /**
   * Construit un PDF minimal conforme à la spécification PDF 1.4
   */
  private buildMinimalPdf(content: string, title: string): Buffer {
    const lines = content.split('\n');
    
    // Construire les opérations de texte PDF
    let textOps = 'BT\n/F1 16 Tf\n50 750 Td\n';
    textOps += `(${this.escapePdfString(title)}) Tj\n`;
    textOps += '/F1 10 Tf\n0 -24 Td\n';
    
    for (const line of lines.slice(1)) {
      textOps += `(${this.escapePdfString(line)}) Tj\n0 -14 Td\n`;
    }
    textOps += 'ET';

    const stream = textOps;
    const streamLength = Buffer.byteLength(stream, 'latin1');

    const objects: string[] = [];
    const offsets: number[] = [];

    // Object 1: Catalog
    objects.push('1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n');
    // Object 2: Pages
    objects.push('2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n');
    // Object 3: Page
    objects.push(`3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n`);
    // Object 4: Content stream
    objects.push(`4 0 obj\n<< /Length ${streamLength} >>\nstream\n${stream}\nendstream\nendobj\n`);
    // Object 5: Font
    objects.push('5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n');

    // Build full PDF
    let pdf = '%PDF-1.4\n';
    for (let i = 0; i < objects.length; i++) {
      offsets.push(Buffer.byteLength(pdf, 'latin1'));
      pdf += objects[i];
    }

    const xrefOffset = Buffer.byteLength(pdf, 'latin1');
    pdf += `xref\n0 ${objects.length + 1}\n`;
    pdf += '0000000000 65535 f \n';
    for (const offset of offsets) {
      pdf += `${offset.toString().padStart(10, '0')} 00000 n \n`;
    }

    pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\n`;
    pdf += `startxref\n${xrefOffset}\n%%EOF\n`;

    return Buffer.from(pdf, 'latin1');
  }

  /**
   * Échapper les caractères spéciaux pour le format PDF
   */
  private escapePdfString(str: string): string {
    return str
      .replace(/\\/g, '\\\\')
      .replace(/\(/g, '\\(')
      .replace(/\)/g, '\\)')
      .replace(/[^\x20-\x7E]/g, '?'); // Remplacer les caractères non-ASCII
  }
}
