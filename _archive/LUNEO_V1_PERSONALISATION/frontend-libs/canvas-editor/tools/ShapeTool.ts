import Konva from 'konva';
import { Stage } from 'konva/lib/Stage';
import { Layer } from 'konva/lib/Layer';

type KonvaShapeNode = {
  stroke(color?: string): string | void;
  strokeWidth(width?: number): number | void;
  fill(color?: string): string | void;
  opacity(val?: number): number | void;
  rotation(angle?: number): number | void;
  scaleX(val?: number): number | void;
  scaleY(val?: number): number | void;
  x(val?: number): number | void;
  y(val?: number): number | void;
  width(): number;
  height(): number;
  id(val?: string): string | void;
  clone(): KonvaShapeNode;
  moveToTop(): void;
  moveToBottom(): void;
  getClientRect(): { x: number; y: number; width: number; height: number };
  destroy(): void;
  filters(): unknown[];
};

export interface ShapeOptions {
  type: 'rectangle' | 'circle' | 'star' | 'polygon' | 'line' | 'arrow' | 'heart' | 'diamond';
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  rotation?: number;
  scaleX?: number;
  scaleY?: number;
  cornerRadius?: number; // For rectangle
  sides?: number; // For polygon
  innerRadius?: number; // For star
  outerRadius?: number; // For star
  points?: number[]; // For custom shapes
  dash?: number[]; // For dashed lines
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffset?: { x: number; y: number };
  shadowOpacity?: number;
}

export interface ShapeElement {
  id: string;
  type: 'shape';
  shapeType: string;
  // Konva Shape properties
  x(): number;
  y(): number;
  width(): number;
  height(): number;
  scaleX(): number;
  scaleY(): number;
  rotation(): number;
  opacity(): number;
  fill(): string;
  stroke(): string;
  strokeWidth(): number;
  visible(): boolean;
  draggable(): boolean;
  selectable(): boolean;
  listening(): boolean;
  perfectDrawEnabled(): boolean;
  shadowColor(): string;
  shadowBlur(): number;
  shadowOffsetX(): number;
  shadowOffsetY(): number;
  shadowOpacity(): number;
  filters(): unknown[];
  cache(): void;
  destroy(): void;
  clone(): ShapeElement;
  getClassName(): string;
}

export class ShapeTool {
  private stage: Stage;
  private designLayer: Layer;
  private selectedShape: ShapeElement | null = null;

  constructor(stage: Stage, designLayer: Layer) {
    this.stage = stage;
    this.designLayer = designLayer;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Click to select shape
    this.stage.on('click', (e) => {
      if (this.isShapeElement(e.target)) {
        this.selectShape(e.target as unknown as ShapeElement);
      } else {
        this.deselectShape();
      }
    });
  }

  private isShapeElement(node: unknown): boolean {
    return node instanceof Konva.Rect ||
           node instanceof Konva.Circle ||
           node instanceof Konva.Star ||
           node instanceof Konva.Line ||
           node instanceof Konva.RegularPolygon ||
           node instanceof Konva.Path;
  }

  /**
   * Add shape to canvas
   */
  addShape(options: ShapeOptions): ShapeElement {
    let shape: Konva.Shape;

    switch (options.type) {
      case 'rectangle':
        shape = new Konva.Rect({
          x: options.x || 50,
          y: options.y || 50,
          width: options.width || 100,
          height: options.height || 100,
          fill: options.fill || '#ff0000',
          stroke: options.stroke || '#000000',
          strokeWidth: options.strokeWidth || 2,
          opacity: options.opacity || 1,
          rotation: options.rotation || 0,
          scaleX: options.scaleX || 1,
          scaleY: options.scaleY || 1,
          cornerRadius: options.cornerRadius || 0,
          draggable: true,
        });
        break;

      case 'circle':
        shape = new Konva.Circle({
          x: options.x || 100,
          y: options.y || 100,
          radius: (options.width || 50) / 2,
          fill: options.fill || '#ff0000',
          stroke: options.stroke || '#000000',
          strokeWidth: options.strokeWidth || 2,
          opacity: options.opacity || 1,
          rotation: options.rotation || 0,
          scaleX: options.scaleX || 1,
          scaleY: options.scaleY || 1,
          draggable: true,
        });
        break;

      case 'star':
        shape = new Konva.Star({
          x: options.x || 100,
          y: options.y || 100,
          numPoints: options.sides || 5,
          innerRadius: options.innerRadius || 30,
          outerRadius: options.outerRadius || 50,
          fill: options.fill || '#ff0000',
          stroke: options.stroke || '#000000',
          strokeWidth: options.strokeWidth || 2,
          opacity: options.opacity || 1,
          rotation: options.rotation || 0,
          scaleX: options.scaleX || 1,
          scaleY: options.scaleY || 1,
          draggable: true,
        });
        break;

      case 'polygon':
        shape = new Konva.RegularPolygon({
          x: options.x || 100,
          y: options.y || 100,
          sides: options.sides || 6,
          radius: (options.width || 50) / 2,
          fill: options.fill || '#ff0000',
          stroke: options.stroke || '#000000',
          strokeWidth: options.strokeWidth || 2,
          opacity: options.opacity || 1,
          rotation: options.rotation || 0,
          scaleX: options.scaleX || 1,
          scaleY: options.scaleY || 1,
          draggable: true,
        });
        break;

      case 'line':
        shape = new Konva.Line({
          points: options.points || [0, 0, 100, 100],
          stroke: options.stroke || '#000000',
          strokeWidth: options.strokeWidth || 2,
          opacity: options.opacity || 1,
          rotation: options.rotation || 0,
          scaleX: options.scaleX || 1,
          scaleY: options.scaleY || 1,
          dash: options.dash,
          draggable: true,
        });
        break;

      case 'arrow':
        shape = new Konva.Arrow({
          points: options.points || [0, 0, 100, 0],
          pointerLength: 20,
          pointerWidth: 20,
          fill: options.fill || '#000000',
          stroke: options.stroke || '#000000',
          strokeWidth: options.strokeWidth || 2,
          opacity: options.opacity || 1,
          rotation: options.rotation || 0,
          scaleX: options.scaleX || 1,
          scaleY: options.scaleY || 1,
          draggable: true,
        });
        break;

      case 'heart':
        shape = new Konva.Path({
          data: 'M12,21.35l-1.45-1.32C5.4,15.36,2,12.28,2,8.5 C2,5.42,4.42,3,7.5,3c1.74,0,3.41,0.81,4.5,2.09C13.09,3.81,14.76,3,16.5,3 C19.58,3,22,5.42,22,8.5c0,3.78-3.4,6.86-8.55,11.54L12,21.35z',
          x: options.x || 50,
          y: options.y || 50,
          scaleX: (options.width || 100) / 100,
          scaleY: (options.height || 100) / 100,
          fill: options.fill || '#ff0000',
          stroke: options.stroke || '#000000',
          strokeWidth: options.strokeWidth || 2,
          opacity: options.opacity || 1,
          rotation: options.rotation || 0,
          draggable: true,
        });
        break;

      case 'diamond':
        shape = new Konva.RegularPolygon({
          x: options.x || 100,
          y: options.y || 100,
          sides: 4,
          radius: (options.width || 50) / 2,
          fill: options.fill || '#ff0000',
          stroke: options.stroke || '#000000',
          strokeWidth: options.strokeWidth || 2,
          opacity: options.opacity || 1,
          rotation: (options.rotation || 0) + 45, // Rotate 45° to make it a diamond
          scaleX: options.scaleX || 1,
          scaleY: options.scaleY || 1,
          draggable: true,
        });
        break;

      default:
        throw new Error(`Unknown shape type: ${options.type}`);
    }

    // Add ID and type
    const shapeElement = shape as unknown as ShapeElement;
    shapeElement.id = `shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    shapeElement.type = 'shape';
    shapeElement.shapeType = options.type;

    // Add shadow if specified
    if (options.shadowColor) {
      shape.shadowColor(options.shadowColor);
      shape.shadowBlur(options.shadowBlur || 5);
      shape.shadowOffset(options.shadowOffset || { x: 2, y: 2 });
      shape.shadowOpacity(options.shadowOpacity || 0.5);
    }

    // Add to layer
    this.designLayer.add(shape);
    this.designLayer.batchDraw();

    // Select the new shape
    this.selectShape(shapeElement);

    return shapeElement;
  }

  /**
   * Select shape element
   */
  selectShape(shapeElement: ShapeElement) {
    this.deselectShape();
    this.selectedShape = shapeElement;
    
    // Add selection visual feedback
    const konvaShape = shapeElement as unknown as KonvaShapeNode;
    konvaShape.stroke('#007bff');
    konvaShape.strokeWidth(3);
    this.designLayer.batchDraw();
  }

  /**
   * Deselect current shape
   */
  deselectShape() {
    if (this.selectedShape) {
      // Restore original stroke
      const konvaShape = this.selectedShape as unknown as KonvaShapeNode;
      konvaShape.stroke('#000000');
      konvaShape.strokeWidth(2);
      this.selectedShape = null;
      this.designLayer.batchDraw();
    }
  }

  /**
   * Update shape properties
   */
  updateShapeProperties(shapeElement: ShapeElement, properties: Partial<ShapeOptions>) {
    if (properties.width !== undefined) {
      if (shapeElement instanceof Konva.Rect) {
        shapeElement.width(properties.width);
      } else if (shapeElement instanceof Konva.Circle) {
        shapeElement.radius(properties.width / 2);
      } else if (shapeElement instanceof Konva.RegularPolygon) {
        shapeElement.radius(properties.width / 2);
      }
    }

    if (properties.height !== undefined) {
      if (shapeElement instanceof Konva.Rect) {
        shapeElement.height(properties.height);
      } else if (shapeElement instanceof Konva.Circle) {
        shapeElement.radius(properties.height / 2);
      } else if (shapeElement instanceof Konva.RegularPolygon) {
        shapeElement.radius(properties.height / 2);
      }
    }

    const konvaShape = shapeElement as unknown as KonvaShapeNode;
    if (properties.fill !== undefined) konvaShape.fill(properties.fill);
    if (properties.stroke !== undefined) konvaShape.stroke(properties.stroke);
    if (properties.strokeWidth !== undefined) konvaShape.strokeWidth(properties.strokeWidth);
    if (properties.opacity !== undefined) konvaShape.opacity(properties.opacity);
    if (properties.rotation !== undefined) konvaShape.rotation(properties.rotation);
    if (properties.scaleX !== undefined) konvaShape.scaleX(properties.scaleX);
    if (properties.scaleY !== undefined) konvaShape.scaleY(properties.scaleY);

    // Update corner radius for rectangles
    if (properties.cornerRadius !== undefined && shapeElement instanceof Konva.Rect) {
      shapeElement.cornerRadius(properties.cornerRadius);
    }

    // Update sides for polygons
    if (properties.sides !== undefined && shapeElement instanceof Konva.RegularPolygon) {
      shapeElement.sides(properties.sides);
    }

    // Update star properties
    if (shapeElement instanceof Konva.Star) {
      if (properties.sides !== undefined) shapeElement.numPoints(properties.sides);
      if (properties.innerRadius !== undefined) shapeElement.innerRadius(properties.innerRadius);
      if (properties.outerRadius !== undefined) shapeElement.outerRadius(properties.outerRadius);
    }

    // Update line points
    if (properties.points !== undefined && shapeElement instanceof Konva.Line) {
      shapeElement.points(properties.points);
    }

    // Update dash for lines
    if (properties.dash !== undefined && shapeElement instanceof Konva.Line) {
      shapeElement.dash(properties.dash);
    }

    this.designLayer.batchDraw();
  }

  /**
   * Delete selected shape
   */
  deleteSelectedShape() {
    if (this.selectedShape) {
      this.selectedShape.destroy();
      this.selectedShape = null;
      this.designLayer.batchDraw();
    }
  }

  /**
   * Duplicate shape element
   */
  duplicateShape(shapeElement: ShapeElement): ShapeElement {
    const konvaShape = shapeElement as unknown as KonvaShapeNode;
    const cloned = konvaShape.clone() as unknown as ShapeElement;
    const clonedKonva = cloned as unknown as KonvaShapeNode;
    const _dupX = konvaShape.x();
    const _dupY = konvaShape.y();
    const currentX = typeof _dupX === 'number' ? _dupX : 0;
    const currentY = typeof _dupY === 'number' ? _dupY : 0;
    clonedKonva.x(currentX + 20);
    clonedKonva.y(currentY + 20);
    clonedKonva.id(`shape_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    this.designLayer.add(cloned as unknown as Konva.Shape);
    this.designLayer.batchDraw();
    return cloned;
  }

  /**
   * Get all shape elements
   */
  getAllShapeElements(): ShapeElement[] {
    return this.designLayer.children
      .filter((node) => this.isShapeElement(node))
      .map((node) => node as unknown as ShapeElement);
  }

  /**
   * Get selected shape element
   */
  getSelectedShape(): ShapeElement | null {
    return this.selectedShape;
  }

  /**
   * Rotate shape by angle
   */
  rotateShape(shapeElement: ShapeElement, angle: number) {
    const konvaShape = shapeElement as unknown as KonvaShapeNode;
    const _rot = konvaShape.rotation();
    const currentRotation = typeof _rot === 'number' ? _rot : 0;
    konvaShape.rotation(currentRotation + angle);
    this.designLayer.batchDraw();
  }

  /**
   * Scale shape
   */
  scaleShape(shapeElement: ShapeElement, scaleX: number, scaleY?: number) {
    const konvaShape = shapeElement as unknown as KonvaShapeNode;
    konvaShape.scaleX(scaleX);
    konvaShape.scaleY(scaleY || scaleX);
    this.designLayer.batchDraw();
  }

  /**
   * Flip shape horizontally
   */
  flipHorizontal(shapeElement: ShapeElement) {
    const konvaShape = shapeElement as unknown as KonvaShapeNode;
    const _sx = konvaShape.scaleX();
    const currentScaleX = typeof _sx === 'number' ? _sx : 1;
    konvaShape.scaleX(-currentScaleX);
    this.designLayer.batchDraw();
  }

  /**
   * Flip shape vertically
   */
  flipVertical(shapeElement: ShapeElement) {
    const konvaShape = shapeElement as unknown as KonvaShapeNode;
    const _sy = konvaShape.scaleY();
    const currentScaleY = typeof _sy === 'number' ? _sy : 1;
    konvaShape.scaleY(-currentScaleY);
    this.designLayer.batchDraw();
  }

  /**
   * Bring shape to front
   */
  bringToFront(shapeElement: ShapeElement) {
    const konvaShape = shapeElement as unknown as KonvaShapeNode;
    konvaShape.moveToTop();
    this.designLayer.batchDraw();
  }

  /**
   * Send shape to back
   */
  sendToBack(shapeElement: ShapeElement) {
    const konvaShape = shapeElement as unknown as KonvaShapeNode;
    konvaShape.moveToBottom();
    this.designLayer.batchDraw();
  }

  /**
   * Get shape bounds
   */
  getShapeBounds(shapeElement: ShapeElement) {
    const konvaShape = shapeElement as unknown as KonvaShapeNode;
    return konvaShape.getClientRect();
  }

  /**
   * Align shapes
   */
  alignShapes(shapes: ShapeElement[], alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') {
    if (shapes.length < 2) return;

    const bounds = shapes.map(shape => {
      const konvaShape = shape as unknown as KonvaShapeNode;
      return konvaShape.getClientRect();
    });
    let targetValue: number;

    switch (alignment) {
      case 'left':
        targetValue = Math.min(...bounds.map(b => b.x));
        shapes.forEach(shape => {
          const konvaShape = shape as unknown as KonvaShapeNode;
          konvaShape.x(targetValue);
        });
        break;
      case 'right':
        targetValue = Math.max(...bounds.map(b => b.x + b.width));
        shapes.forEach(shape => {
          const konvaShape = shape as unknown as KonvaShapeNode;
          konvaShape.x(targetValue - (Number(konvaShape.width()) || 0));
        });
        break;
      case 'center':
        targetValue = bounds.reduce((sum, b) => sum + b.x + b.width / 2, 0) / bounds.length;
        shapes.forEach(shape => {
          const konvaShape = shape as unknown as KonvaShapeNode;
          konvaShape.x(targetValue - (Number(konvaShape.width()) || 0) / 2);
        });
        break;
      case 'top':
        targetValue = Math.min(...bounds.map(b => b.y));
        shapes.forEach(shape => {
          const konvaShape = shape as unknown as KonvaShapeNode;
          konvaShape.y(targetValue);
        });
        break;
      case 'bottom':
        targetValue = Math.max(...bounds.map(b => b.y + b.height));
        shapes.forEach(shape => {
          const konvaShape = shape as unknown as KonvaShapeNode;
          konvaShape.y(targetValue - (Number(konvaShape.height()) || 0));
        });
        break;
      case 'middle':
        targetValue = bounds.reduce((sum, b) => sum + b.y + b.height / 2, 0) / bounds.length;
        shapes.forEach(shape => {
          const konvaShape = shape as unknown as KonvaShapeNode;
          konvaShape.y(targetValue - (Number(konvaShape.height()) || 0) / 2);
        });
        break;
    }

    this.designLayer.batchDraw();
  }
}

export default ShapeTool;
