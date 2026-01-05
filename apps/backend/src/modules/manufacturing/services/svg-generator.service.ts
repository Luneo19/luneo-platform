import { Injectable, Logger } from '@nestjs/common';
import { Prisma } from '@prisma/client';

@Injectable()
export class SvgGeneratorService {
  private readonly logger = new Logger(SvgGeneratorService.name);

  /**
   * Générer un SVG depuis un snapshot
   * TODO: Implémenter la génération réelle depuis specData
   */
  async generate(snapshot: any): Promise<Buffer> {
    // Pour l'instant, générer un SVG basique
    // TODO: Parser specData et générer le SVG réel

    const specData = snapshot.specData as any;
    const zones = specData?.zones || [];

    // Générer SVG basique
    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
  <rect width="800" height="600" fill="#ffffff"/>
`;

    // Ajouter les zones avec leurs inputs
    for (const zone of zones) {
      if (zone.input && zone.input.text) {
        const x = 100; // TODO: Utiliser position réelle depuis zone
        const y = 100 + zones.indexOf(zone) * 50;
        const fontSize = zone.input.size || 24;
        const color = zone.input.color || '#000000';
        const font = zone.input.font || 'Arial';

        svg += `  <text x="${x}" y="${y}" font-family="${font}" font-size="${fontSize}" fill="${color}">${this.escapeXml(zone.input.text)}</text>\n`;
      }
    }

    svg += `</svg>`;

    return Buffer.from(svg, 'utf-8');
  }

  /**
   * Échapper les caractères XML
   */
  private escapeXml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }
}








