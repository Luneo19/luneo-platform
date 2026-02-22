import { Injectable, Logger } from '@nestjs/common';

/** Zone in specData for DXF: position, size, optional text */
interface DxfSpecZone {
  x: number;
  y: number;
  width: number;
  height: number;
  type?: 'text' | 'image';
  content?: string;
  fontSize?: number;
  input?: { text?: string; size?: number };
}

interface DxfSpecData {
  width?: number;
  height?: number;
  zones?: DxfSpecZone[];
}

@Injectable()
export class DxfGeneratorService {
  private readonly logger = new Logger(DxfGeneratorService.name);

  /**
   * Générer un DXF ASCII depuis un snapshot en utilisant les coordonnées réelles de specData.
   * Construit le fichier par chaîne (sans librairie externe) avec HEADER, TABLES, ENTITIES, EOF.
   */
  async generate(snapshot: { specData?: DxfSpecData; id?: string }): Promise<Buffer> {
    const specData = (snapshot?.specData ?? {}) as DxfSpecData;
    const zones = specData.zones ?? [];
    const width = Math.max(1, Number(specData.width) || 800);
    const height = Math.max(1, Number(specData.height) || 600);

    const lines: string[] = [];

    // HEADER
    lines.push('0', 'SECTION', '2', 'HEADER');
    lines.push('9', '$ACADVER', '1', 'AC1015');
    lines.push('9', '$INSBASE', '10', '0.0', '20', '0.0', '30', '0.0');
    lines.push('9', '$EXTMIN', '10', '0.0', '20', '0.0', '30', '0.0');
    lines.push('9', '$EXTMAX', '10', String(width), '20', String(height), '30', '0.0');
    lines.push('0', 'ENDSEC');

    // TABLES (minimal LAYER table)
    lines.push('0', 'SECTION', '2', 'TABLES');
    lines.push('0', 'TABLE', '2', 'LAYER', '70', '1');
    lines.push('0', 'LAYER', '2', '0', '70', '0', '62', '7', '6', 'CONTINUOUS');
    lines.push('0', 'ENDTAB');
    lines.push('0', 'ENDSEC');

    // BLOCKS (empty)
    lines.push('0', 'SECTION', '2', 'BLOCKS');
    lines.push('0', 'ENDSEC');

    // ENTITIES
    lines.push('0', 'SECTION', '2', 'ENTITIES');

    for (const zone of zones) {
      const x = Number(zone.x) || 0;
      const y = Number(zone.y) || 0;
      const zoneWidth = Math.max(0, Number(zone.width) || 100);
      const zoneHeight = Math.max(0, Number(zone.height) || 50);

      // Rectangle as four LINE entities (real coordinates from zone)
      const x2 = x + zoneWidth;
      const y2 = y + zoneHeight;
      const lineCoords: [number, number, number, number][] = [
        [x, y, x2, y],
        [x2, y, x2, y2],
        [x2, y2, x, y2],
        [x, y2, x, y],
      ];
      for (const [x1, y1, x11, y11] of lineCoords) {
        lines.push('0', 'LINE', '8', '0');
        lines.push('10', String(x1), '20', String(y1), '30', '0.0');
        lines.push('11', String(x11), '21', String(y11), '31', '0.0');
      }

      const textContent = zone.content ?? zone.input?.text ?? '';
      if (textContent) {
        const textHeight = Math.max(0.1, Number(zone.fontSize ?? zone.input?.size) || 24);
        const insertY = y + zoneHeight - textHeight * 0.2;
        lines.push('0', 'TEXT', '8', '0');
        lines.push('10', String(x), '20', String(insertY), '30', '0.0');
        lines.push('40', String(textHeight), '1', this.escapeDxfText(textContent));
      }
    }

    lines.push('0', 'ENDSEC');
    lines.push('0', 'EOF');

    const dxf = lines.join('\n') + '\n';
    return Buffer.from(dxf, 'utf-8');
  }

  /**
   * Escape DXF special sequences in text (e.g. % -> %%)
   */
  private escapeDxfText(text: string): string {
    return String(text).replace(/%/g, '%%');
  }
}











