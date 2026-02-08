import { Injectable, Logger } from '@nestjs/common';

/** Zone in specData: position, size, type and content */
export interface SpecZone {
  x: number;
  y: number;
  width: number;
  height: number;
  type?: 'text' | 'image';
  content?: string;
  color?: string;
  backgroundColor?: string;
  fontSize?: number;
  font?: string;
  input?: {
    text?: string;
    size?: number;
    color?: string;
    font?: string;
    url?: string;
  };
}

/** Shape of specData passed to the generator */
export interface SpecData {
  width?: number;
  height?: number;
  background?: string;
  zones?: SpecZone[];
}

@Injectable()
export class SvgGeneratorService {
  private readonly logger = new Logger(SvgGeneratorService.name);

  /**
   * Générer un SVG depuis un snapshot en parsant specData (zones, dimensions, couleurs, texte).
   */
  async generate(snapshot: any): Promise<Buffer> {
    const specData = (snapshot?.specData ?? {}) as SpecData;
    const zones = specData.zones ?? [];
    const width = Math.max(1, Number(specData.width) || 800);
    const height = Math.max(1, Number(specData.height) || 600);
    const background = specData.background ?? '#ffffff';

    let svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="100%" height="100%" fill="${this.escapeXml(background)}"/>
`;

    for (const zone of zones) {
      const x = Number(zone.x) || 0;
      const y = Number(zone.y) || 0;
      const zoneWidth = Math.max(0, Number(zone.width) || 100);
      const zoneHeight = Math.max(0, Number(zone.height) || 50);
      const type = zone.type ?? (zone.input?.text ? 'text' : zone.input?.url ? 'image' : 'text');

      if (type === 'image') {
        const href = zone.content ?? zone.input?.url ?? '';
        if (href) {
          svg += `  <image x="${x}" y="${y}" width="${zoneWidth}" height="${zoneHeight}" href="${this.escapeXml(href)}" preserveAspectRatio="xMidYMid meet"/>\n`;
        } else {
          svg += `  <rect x="${x}" y="${y}" width="${zoneWidth}" height="${zoneHeight}" fill="#f0f0f0" stroke="#ccc"/>\n`;
        }
        continue;
      }

      // type === 'text' or fallback
      const textContent = zone.content ?? zone.input?.text ?? '';
      const color = zone.color ?? zone.input?.color ?? '#000000';
      const fontSize = Math.max(1, Number(zone.fontSize ?? zone.input?.size) || 24);
      const font = zone.font ?? zone.input?.font ?? 'Arial';
      const bgColor = zone.backgroundColor;

      if (bgColor) {
        svg += `  <rect x="${x}" y="${y}" width="${zoneWidth}" height="${zoneHeight}" fill="${this.escapeXml(bgColor)}"/>\n`;
      }
      if (textContent) {
        const baselineY = y + Math.min(fontSize, zoneHeight - 2);
        svg += `  <text x="${x}" y="${baselineY}" font-family="${this.escapeXml(font)}" font-size="${fontSize}" fill="${this.escapeXml(color)}">${this.escapeXml(textContent)}</text>\n`;
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











