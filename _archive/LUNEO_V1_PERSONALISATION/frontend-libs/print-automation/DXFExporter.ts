/**
 * DXFExporter.ts - Export DXF pour laser cutting
 * 
 * Generates DXF files for laser cutting and CNC machining
 * Handles vector paths, layers, and cutting specifications
 */

export interface DXFEntity {
  type: 'LINE' | 'CIRCLE' | 'ARC' | 'POLYLINE' | 'TEXT' | 'SPLINE';
  layer: string;
  color: number;
  lineType: string;
  data: Record<string, unknown>;
}

export interface DXFLayer {
  name: string;
  color: number;
  lineType: string;
  visible: boolean;
  frozen: boolean;
  locked: boolean;
}

export interface DXFSettings {
  version: 'R12' | 'R2000' | 'R2004' | 'R2007' | 'R2010' | 'R2013' | 'R2018';
  units: 'MM' | 'INCHES' | 'FEET' | 'METERS';
  precision: number; // decimal places
  layers: DXFLayer[];
  cuttingSettings: {
    cutSpeed: number; // mm/min
    power: number; // percentage
    passes: number;
    kerf: number; // mm
    leadIn: number; // mm
    leadOut: number; // mm
  };
}

export interface DXFResult {
  success: boolean;
  dxfContent?: string;
  fileSize: number;
  warnings: string[];
  errors: string[];
  metadata: {
    entities: number;
    layers: number;
    boundingBox: {
      minX: number;
      minY: number;
      maxX: number;
      maxY: number;
    };
  };
}

export class DXFExporter {
  private defaultSettings: DXFSettings;

  constructor() {
    this.defaultSettings = {
      version: 'R2018',
      units: 'MM',
      precision: 3,
      layers: [
        { name: 'CUT', color: 1, lineType: 'CONTINUOUS', visible: true, frozen: false, locked: false },
        { name: 'ENGRAVE', color: 2, lineType: 'CONTINUOUS', visible: true, frozen: false, locked: false },
        { name: 'SCORE', color: 3, lineType: 'DASHED', visible: true, frozen: false, locked: false },
        { name: 'DRILL', color: 4, lineType: 'CONTINUOUS', visible: true, frozen: false, locked: false }
      ],
      cuttingSettings: {
        cutSpeed: 1000, // mm/min
        power: 80, // percentage
        passes: 1,
        kerf: 0.1, // mm
        leadIn: 2, // mm
        leadOut: 2 // mm
      }
    };
  }

  /**
   * Generate DXF from vector data
   */
  public generateDXF(
    entities: DXFEntity[],
    settings: DXFSettings = this.defaultSettings
  ): DXFResult {
    const result: DXFResult = {
      success: false,
      fileSize: 0,
      warnings: [],
      errors: [],
      metadata: {
        entities: 0,
        layers: 0,
        boundingBox: { minX: 0, minY: 0, maxX: 0, maxY: 0 }
      }
    };

    try {
      // Validate inputs
      const validation = this.validateInputs(entities, settings);
      if (!validation.valid) {
        result.errors = validation.errors;
        return result;
      }

      // Calculate bounding box
      const boundingBox = this.calculateBoundingBox(entities);
      result.metadata.boundingBox = boundingBox;

      // Generate DXF content
      const dxfContent = this.generateDXFContent(entities, settings, boundingBox);
      
      result.success = true;
      result.dxfContent = dxfContent;
      result.fileSize = dxfContent.length;
      result.metadata.entities = entities.length;
      result.metadata.layers = settings.layers.length;

    } catch (error) {
      result.errors.push(`DXF generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  /**
   * Convert SVG paths to DXF entities
   */
  public convertSVGToDXF(svgContent: string, settings: DXFSettings = this.defaultSettings): DXFResult {
    try {
      const entities = this.parseSVGPaths(svgContent);
      return this.generateDXF(entities, settings);
    } catch (error) {
      return {
        success: false,
        fileSize: 0,
        warnings: [],
        errors: [`SVG conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        metadata: {
          entities: 0,
          layers: 0,
          boundingBox: { minX: 0, minY: 0, maxX: 0, maxY: 0 }
        }
      };
    }
  }

  /**
   * Convert Konva.js shapes to DXF entities
   */
  public convertKonvaToDXF(
    konvaData: Record<string, unknown> & { children?: Array<Record<string, unknown>> },
    settings: DXFSettings = this.defaultSettings
  ): DXFResult {
    try {
      const entities = this.parseKonvaShapes(konvaData);
      return this.generateDXF(entities, settings);
    } catch (error) {
      return {
        success: false,
        fileSize: 0,
        warnings: [],
        errors: [`Konva conversion failed: ${error instanceof Error ? error.message : 'Unknown error'}`],
        metadata: {
          entities: 0,
          layers: 0,
          boundingBox: { minX: 0, minY: 0, maxX: 0, maxY: 0 }
        }
      };
    }
  }

  /**
   * Validate input parameters
   */
  private validateInputs(entities: DXFEntity[], settings: DXFSettings): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!entities || entities.length === 0) {
      errors.push('No entities provided');
    }

    if (!settings.layers || settings.layers.length === 0) {
      errors.push('No layers defined');
    }

    if (settings.precision < 0 || settings.precision > 10) {
      errors.push('Precision must be between 0-10');
    }

    if (settings.cuttingSettings.cutSpeed <= 0) {
      errors.push('Cut speed must be greater than 0');
    }

    if (settings.cuttingSettings.power < 0 || settings.cuttingSettings.power > 100) {
      errors.push('Power must be between 0-100%');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Calculate bounding box of all entities
   */
  private calculateBoundingBox(entities: DXFEntity[]): { minX: number; minY: number; maxX: number; maxY: number } {
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

    entities.forEach(entity => {
      const bounds = this.getEntityBounds(entity);
      minX = Math.min(minX, bounds.minX);
      minY = Math.min(minY, bounds.minY);
      maxX = Math.max(maxX, bounds.maxX);
      maxY = Math.max(maxY, bounds.maxY);
    });

    return { minX, minY, maxX, maxY };
  }

  /**
   * Get bounding box for a single entity
   */
  private getEntityBounds(entity: DXFEntity): { minX: number; minY: number; maxX: number; maxY: number } {
    const d = entity.data as Record<string, number>;
    switch (entity.type) {
      case 'LINE':
        return {
          minX: Math.min(d.x1, d.x2),
          minY: Math.min(d.y1, d.y2),
          maxX: Math.max(d.x1, d.x2),
          maxY: Math.max(d.y1, d.y2)
        };
      case 'CIRCLE':
        return {
          minX: d.centerX - d.radius,
          minY: d.centerY - d.radius,
          maxX: d.centerX + d.radius,
          maxY: d.centerY + d.radius
        };
      case 'ARC':
        // Simplified arc bounds calculation
        return {
          minX: d.centerX - d.radius,
          minY: d.centerY - d.radius,
          maxX: d.centerX + d.radius,
          maxY: d.centerY + d.radius
        };
      case 'POLYLINE': {
        let minX = Infinity;
        let minY = Infinity;
        let maxX = -Infinity;
        let maxY = -Infinity;
        const points = entity.data.points as Array<{ x: number; y: number }>;
        points.forEach((point) => {
          minX = Math.min(minX, point.x);
          minY = Math.min(minY, point.y);
          maxX = Math.max(maxX, point.x);
          maxY = Math.max(maxY, point.y);
        });
        return { minX, minY, maxX, maxY };
      }
      default:
        return { minX: 0, minY: 0, maxX: 0, maxY: 0 };
    }
  }

  /**
   * Generate DXF content
   */
  private generateDXFContent(
    entities: DXFEntity[],
    settings: DXFSettings,
    _boundingBox: { minX: number; minY: number; maxX: number; maxY: number }
  ): string {
    let dxf = '';

    // DXF Header
    dxf += this.generateDXFHeader(settings);
    
    // DXF Classes
    dxf += this.generateDXFClasses();
    
    // DXF Tables
    dxf += this.generateDXFTables(settings);
    
    // DXF Blocks
    dxf += this.generateDXFBlocks();
    
    // DXF Entities
    dxf += this.generateDXFEntities(entities, settings);
    
    // DXF Objects
    dxf += this.generateDXFObjects();
    
    // DXF End
    dxf += '0\nEOF\n';

    return dxf;
  }

  /**
   * Generate DXF header section
   */
  private generateDXFHeader(settings: DXFSettings): string {
    return `0
SECTION
2
HEADER
9
$ACADVER
1
${settings.version}
9
$INSUNITS
70
${this.getUnitsCode(settings.units)}
9
$DIMDEC
70
${settings.precision}
9
$DIMADEC
70
${settings.precision}
0
ENDSEC
`;
  }

  /**
   * Generate DXF classes section
   */
  private generateDXFClasses(): string {
    return `0
SECTION
2
CLASSES
0
ENDSEC
`;
  }

  /**
   * Generate DXF tables section
   */
  private generateDXFTables(settings: DXFSettings): string {
    let tables = `0
SECTION
2
TABLES
`;

    // Layer table
    tables += `0
TABLE
2
LAYER
70
${settings.layers.length}
`;

    settings.layers.forEach(layer => {
      tables += `0
LAYER
2
${layer.name}
70
0
62
${layer.color}
6
${layer.lineType}
`;
    });

    tables += `0
ENDTAB
`;

    // Line type table
    tables += `0
TABLE
2
LTYPE
70
1
0
LTYPE
2
CONTINUOUS
70
0
3
Solid line
72
65
73
0
40
0.0
0
ENDTAB
`;

    tables += `0
ENDSEC
`;

    return tables;
  }

  /**
   * Generate DXF blocks section
   */
  private generateDXFBlocks(): string {
    return `0
SECTION
2
BLOCKS
0
ENDSEC
`;
  }

  /**
   * Generate DXF entities section
   */
  private generateDXFEntities(entities: DXFEntity[], settings: DXFSettings): string {
    let entitiesSection = `0
SECTION
2
ENTITIES
`;

    entities.forEach(entity => {
      entitiesSection += this.generateEntity(entity, settings);
    });

    entitiesSection += `0
ENDSEC
`;

    return entitiesSection;
  }

  /**
   * Generate individual entity
   */
  private generateEntity(entity: DXFEntity, settings: DXFSettings): string {
    let entityStr = `0
${entity.type}
8
${entity.layer}
62
${entity.color}
6
${entity.lineType}
`;

    switch (entity.type) {
      case 'LINE':
        entityStr += `10
${this.formatNumber(Number(Number(entity.data.x1)), settings.precision)}
20
${this.formatNumber(Number(Number(entity.data.y1)), settings.precision)}
30
0.0
11
${this.formatNumber(Number(Number(entity.data.x2)), settings.precision)}
21
${this.formatNumber(Number(Number(entity.data.y2)), settings.precision)}
31
0.0
`;
        break;

      case 'CIRCLE':
        entityStr += `10
${this.formatNumber(Number(entity.data.centerX), settings.precision)}
20
${this.formatNumber(Number(entity.data.centerY), settings.precision)}
30
0.0
40
${this.formatNumber(Number(entity.data.radius), settings.precision)}
`;
        break;

      case 'ARC':
        entityStr += `10
${this.formatNumber(Number(entity.data.centerX), settings.precision)}
20
${this.formatNumber(Number(entity.data.centerY), settings.precision)}
30
0.0
40
${this.formatNumber(Number(entity.data.radius), settings.precision)}
50
${this.formatNumber(Number(entity.data.startAngle), settings.precision)}
51
${this.formatNumber(Number(entity.data.endAngle), settings.precision)}
`;
        break;

      case 'POLYLINE':
        entityStr += `70
${(entity.data.closed as boolean) ? 1 : 0}
`;
        const points = entity.data.points as Array<{ x: number; y: number }>;
        points.forEach((point) => {
          entityStr += `0
VERTEX
10
${this.formatNumber(point.x, settings.precision)}
20
${this.formatNumber(point.y, settings.precision)}
30
0.0
`;
        });
        entityStr += `0
SEQEND
`;
        break;

      case 'TEXT':
        entityStr += `10
${this.formatNumber(Number(Number(entity.data.x)), settings.precision)}
20
${this.formatNumber(Number(Number(entity.data.y)), settings.precision)}
30
0.0
40
${this.formatNumber(Number(Number(entity.data.height)), settings.precision)}
1
${String(entity.data.text || '')}
`;
        break;
    }

    return entityStr;
  }

  /**
   * Generate DXF objects section
   */
  private generateDXFObjects(): string {
    return `0
SECTION
2
OBJECTS
0
ENDSEC
`;
  }

  /**
   * Parse SVG paths to DXF entities
   */
  private parseSVGPaths(svgContent: string): DXFEntity[] {
    const entities: DXFEntity[] = [];
    
    // This is a simplified SVG parser
    // In a real implementation, you'd use a proper SVG parsing library
    
    const pathRegex = /<path[^>]*d="([^"]*)"[^>]*>/g;
    let match;
    
    while ((match = pathRegex.exec(svgContent)) !== null) {
      const pathData = match[1];
      const pathEntities = this.parsePathData(pathData);
      entities.push(...pathEntities);
    }
    
    return entities;
  }

  /**
   * Parse SVG path data
   */
  private parsePathData(pathData: string): DXFEntity[] {
    const entities: DXFEntity[] = [];
    const commands = pathData.match(/[MmLlHhVvCcSsQqTtAaZz][^MmLlHhVvCcSsQqTtAaZz]*/g) || [];
    
    let currentX = 0, currentY = 0;
    
    commands.forEach(command => {
      const type = command[0];
      const coords = command.slice(1).trim().split(/[\s,]+/).map(Number);
      
      switch (type.toLowerCase()) {
        case 'm': // Move to
          currentX += coords[0] || 0;
          currentY += coords[1] || 0;
          break;
          
        case 'l': { // Line to
          const endX = type === 'l' ? currentX + coords[0] : coords[0];
          const endY = type === 'l' ? currentY + coords[1] : coords[1];
          
          entities.push({
            type: 'LINE',
            layer: 'CUT',
            color: 1,
            lineType: 'CONTINUOUS',
            data: { x1: currentX, y1: currentY, x2: endX, y2: endY }
          });
          
          currentX = endX;
          currentY = endY;
          break;
        }
          
        case 'c': { // Cubic bezier curve
          // Simplified: convert to polyline
          const points = [
            { x: currentX, y: currentY },
            { x: coords[0], y: coords[1] },
            { x: coords[2], y: coords[3] },
            { x: coords[4], y: coords[5] }
          ];
          
          entities.push({
            type: 'POLYLINE',
            layer: 'CUT',
            color: 1,
            lineType: 'CONTINUOUS',
            data: { points, closed: false }
          });
          
          currentX = coords[4];
          currentY = coords[5];
          break;
        }
      }
    });
    
    return entities;
  }

  /**
   * Parse Konva.js shapes to DXF entities
   */
  private parseKonvaShapes(konvaData: Record<string, unknown> & { children?: Array<Record<string, unknown>> }): DXFEntity[] {
    const entities: DXFEntity[] = [];
    
    if (konvaData.children) {
      konvaData.children.forEach((child: Record<string, unknown>) => {
        const childEntities = this.parseKonvaShape(child);
        entities.push(...childEntities);
      });
    }
    
    return entities;
  }

  /**
   * Parse individual Konva shape
   */
  private parseKonvaShape(shape: Record<string, unknown>): DXFEntity[] {
    const attrs = (shape.attrs ?? {}) as Record<string, unknown>;
    const attrPoints = (attrs.points ?? []) as number[];
    const entities: DXFEntity[] = [];
    
    switch (shape.className) {
      case 'Line':
        entities.push({
          type: 'LINE',
          layer: 'CUT',
          color: 1,
          lineType: 'CONTINUOUS',
          data: {
            x1: attrPoints[0],
            y1: attrPoints[1],
            x2: attrPoints[2],
            y2: attrPoints[3]
          }
        });
        break;
        
      case 'Circle':
        entities.push({
          type: 'CIRCLE',
          layer: 'CUT',
          color: 1,
          lineType: 'CONTINUOUS',
          data: {
            centerX: Number(attrs.x ?? 0),
            centerY: Number(attrs.y ?? 0),
            radius: Number(attrs.radius ?? 0)
          }
        });
        break;
        
      case 'Rect': {
        const x = Number(attrs.x ?? 0);
        const y = Number(attrs.y ?? 0);
        const width = Number(attrs.width ?? 0);
        const height = Number(attrs.height ?? 0);
        
        entities.push({
          type: 'POLYLINE',
          layer: 'CUT',
          color: 1,
          lineType: 'CONTINUOUS',
          data: {
            points: [
              { x, y },
              { x: x + width, y },
              { x: x + width, y: y + height },
              { x, y: y + height }
            ],
            closed: true
          }
        });
        break;
      }
    }
    
    return entities;
  }

  /**
   * Format number with specified precision
   */
  private formatNumber(num: number, precision: number): string {
    return num.toFixed(precision);
  }

  /**
   * Get units code for DXF
   */
  private getUnitsCode(units: string): number {
    switch (units) {
      case 'MM': return 4;
      case 'INCHES': return 1;
      case 'FEET': return 2;
      case 'METERS': return 6;
      default: return 4;
    }
  }

  /**
   * Generate cutting instructions
   */
  public generateCuttingInstructions(settings: DXFSettings): string {
    return `; Laser Cutting Instructions
; Generated by Luneo DXF Exporter

; Cutting Settings
CUT_SPEED=${settings.cuttingSettings.cutSpeed}
POWER=${settings.cuttingSettings.power}
PASSES=${settings.cuttingSettings.passes}
KERF=${settings.cuttingSettings.kerf}
LEAD_IN=${settings.cuttingSettings.leadIn}
LEAD_OUT=${settings.cuttingSettings.leadOut}

; Layer Settings
${settings.layers.map(layer => 
  `LAYER_${layer.name.toUpperCase()}_SPEED=${settings.cuttingSettings.cutSpeed}
LAYER_${layer.name.toUpperCase()}_POWER=${settings.cuttingSettings.power}`
).join('\n')}

; Instructions
; 1. Load DXF file into laser cutting software
; 2. Set cutting parameters as specified above
; 3. Ensure material is properly secured
; 4. Run cutting job
; 5. Check for any uncut areas and re-run if necessary
`;
  }
}

// Export singleton instance
export const dxfExporter = new DXFExporter();

// Export utility functions
export const generateDXF = (
  entities: DXFEntity[],
  settings?: DXFSettings
): DXFResult => {
  return dxfExporter.generateDXF(entities, settings);
};

export const convertSVGToDXF = (
  svgContent: string,
  settings?: DXFSettings
): DXFResult => {
  return dxfExporter.convertSVGToDXF(svgContent, settings);
};

export const convertKonvaToDXF = (
  konvaData: Record<string, unknown> & { children?: Array<Record<string, unknown>> },
  settings?: DXFSettings
): DXFResult => {
  return dxfExporter.convertKonvaToDXF(konvaData, settings);
};
