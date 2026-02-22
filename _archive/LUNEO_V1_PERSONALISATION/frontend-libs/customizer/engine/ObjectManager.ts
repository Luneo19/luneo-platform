/**
 * ObjectManager
 * CRUD operations for canvas objects (text, images, shapes, etc.)
 */

import Konva from 'konva';
import QRCode from 'qrcode';

export interface TextConfig {
  id?: string;
  text: string;
  x: number;
  y: number;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  fontStyle?: 'normal' | 'bold' | 'italic' | 'bold italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  opacity?: number;
  rotation?: number;
  width?: number;
  height?: number;
  draggable?: boolean;
}

export interface ImageConfig {
  id?: string;
  src: string;
  x: number;
  y: number;
  width?: number;
  height?: number;
  opacity?: number;
  rotation?: number;
  draggable?: boolean;
  crop?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface ShapeConfig {
  id?: string;
  x: number;
  y: number;
  width: number;
  height: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  opacity?: number;
  rotation?: number;
  draggable?: boolean;
  cornerRadius?: number; // For rectangles
  sides?: number; // For polygons
  radius?: number; // For stars/polygons
  innerRadius?: number; // For stars
  points?: number[]; // For custom polygons
}

export interface DrawingLineConfig {
  id?: string;
  points: number[];
  stroke?: string;
  strokeWidth?: number;
  lineCap?: 'butt' | 'round' | 'square';
  lineJoin?: 'miter' | 'round' | 'bevel';
  tension?: number;
  opacity?: number;
  draggable?: boolean;
}

export interface QRCodeConfig {
  id?: string;
  data: string;
  x: number;
  y: number;
  size?: number;
  margin?: number;
  color?: string;
  backgroundColor?: string;
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H';
  draggable?: boolean;
}

/**
 * Manages CRUD operations for canvas objects
 */
export class ObjectManager {
  private layer: Konva.Layer;
  private objects: Map<string, Konva.Node> = new Map();

  constructor(layer: Konva.Layer) {
    this.layer = layer;
  }

  /**
   * Adds a text object to the canvas
   */
  addText(config: TextConfig): Konva.Text {
    const textNode = new Konva.Text({
      id: config.id || `text-${Date.now()}-${Math.random()}`,
      text: config.text,
      x: config.x,
      y: config.y,
      fontSize: config.fontSize || 24,
      fontFamily: config.fontFamily || 'Arial',
      fill: config.fill || '#000000',
      align: config.align || 'left',
      verticalAlign: config.verticalAlign || 'top',
      fontStyle: config.fontStyle || 'normal',
      textDecoration: config.textDecoration || 'none',
      opacity: config.opacity ?? 1,
      rotation: config.rotation || 0,
      width: config.width,
      height: config.height,
      draggable: config.draggable ?? true,
    });

    this.layer.add(textNode);
    this.objects.set(textNode.id(), textNode);

    return textNode;
  }

  /**
   * Adds an image to the canvas
   */
  async addImage(config: ImageConfig): Promise<Konva.Image> {
    return new Promise((resolve, reject) => {
      const imageObj = new Image();
      imageObj.crossOrigin = 'anonymous';

      imageObj.onload = () => {
        const imageNode = new Konva.Image({
          id: config.id || `image-${Date.now()}-${Math.random()}`,
          x: config.x,
          y: config.y,
          image: imageObj,
          width: config.width || imageObj.width,
          height: config.height || imageObj.height,
          opacity: config.opacity ?? 1,
          rotation: config.rotation || 0,
          draggable: config.draggable ?? true,
        });

        // Apply crop if specified
        if (config.crop) {
          imageNode.crop({
            x: config.crop.x,
            y: config.crop.y,
            width: config.crop.width,
            height: config.crop.height,
          });
        }

        this.layer.add(imageNode);
        this.objects.set(imageNode.id(), imageNode);

        resolve(imageNode);
      };

      imageObj.onerror = () => {
        reject(new Error(`Failed to load image: ${config.src}`));
      };

      imageObj.src = config.src;
    });
  }

  /**
   * Adds a shape to the canvas
   */
  addShape(
    type: 'rect' | 'circle' | 'ellipse' | 'triangle' | 'star' | 'polygon',
    config: ShapeConfig
  ): Konva.Shape {
    let shape: Konva.Shape;

    const baseConfig = {
      id: config.id || `${type}-${Date.now()}-${Math.random()}`,
      x: config.x,
      y: config.y,
      fill: config.fill || '#3B82F6',
      stroke: config.stroke || '#000000',
      strokeWidth: config.strokeWidth || 0,
      opacity: config.opacity ?? 1,
      rotation: config.rotation || 0,
      draggable: config.draggable ?? true,
    };

    switch (type) {
      case 'rect':
        shape = new Konva.Rect({
          ...baseConfig,
          width: config.width,
          height: config.height,
          cornerRadius: config.cornerRadius || 0,
        });
        break;

      case 'circle':
        shape = new Konva.Circle({
          ...baseConfig,
          radius: config.radius || config.width / 2,
        });
        break;

      case 'ellipse':
        shape = new Konva.Ellipse({
          ...baseConfig,
          radiusX: config.width / 2,
          radiusY: config.height / 2,
        });
        break;

      case 'triangle':
        shape = new Konva.RegularPolygon({
          ...baseConfig,
          sides: 3,
          radius: config.radius || Math.min(config.width, config.height) / 2,
        });
        break;

      case 'star':
        shape = new Konva.Star({
          ...baseConfig,
          numPoints: config.sides || 5,
          innerRadius: config.innerRadius || (config.radius || config.width / 2) * 0.4,
          outerRadius: config.radius || config.width / 2,
        });
        break;

      case 'polygon':
        if (!config.points || config.points.length < 6) {
          throw new Error('Polygon requires at least 3 points (6 coordinates)');
        }
        shape = new Konva.Line({
          ...baseConfig,
          points: config.points,
          closed: true,
        });
        break;

      default:
        throw new Error(`Unknown shape type: ${type}`);
    }

    this.layer.add(shape);
    this.objects.set(shape.id(), shape);

    return shape;
  }

  /**
   * Adds a drawing line to the canvas
   */
  addDrawingLine(config: DrawingLineConfig): Konva.Line {
    const lineNode = new Konva.Line({
      id: config.id || `line-${Date.now()}-${Math.random()}`,
      points: config.points,
      stroke: config.stroke || '#000000',
      strokeWidth: config.strokeWidth || 2,
      lineCap: config.lineCap || 'round',
      lineJoin: config.lineJoin || 'round',
      tension: config.tension || 0,
      opacity: config.opacity ?? 1,
      draggable: config.draggable ?? true,
      globalCompositeOperation: 'source-over',
    });

    this.layer.add(lineNode);
    this.objects.set(lineNode.id(), lineNode);

    return lineNode;
  }

  /**
   * Adds a QR code to the canvas
   */
  async addQRCode(data: string, config: QRCodeConfig): Promise<Konva.Group> {
    return new Promise((resolve, reject) => {
      const size = config.size || 200;
      const margin = config.margin || 4;

      QRCode.toDataURL(
        data,
        {
          width: size,
          margin: margin,
          color: {
            dark: config.color || '#000000',
            light: config.backgroundColor || '#FFFFFF',
          },
          errorCorrectionLevel: config.errorCorrectionLevel || 'M',
        },
        (err, dataURL) => {
          if (err) {
            reject(err);
            return;
          }

          const imageObj = new Image();
          imageObj.onload = () => {
            const qrImage = new Konva.Image({
              image: imageObj,
              x: config.x,
              y: config.y,
              width: size,
              height: size,
              draggable: config.draggable ?? true,
            });

            const group = new Konva.Group({
              id: config.id || `qrcode-${Date.now()}-${Math.random()}`,
              x: config.x,
              y: config.y,
              draggable: config.draggable ?? true,
            });

            group.add(qrImage);
            this.layer.add(group);
            this.objects.set(group.id(), group);

            resolve(group);
          };

          imageObj.onerror = () => {
            reject(new Error('Failed to create QR code image'));
          };

          imageObj.src = dataURL;
        }
      );
    });
  }

  /**
   * Updates object attributes
   */
  updateObject(id: string, attrs: Partial<Konva.NodeConfig>): void {
    const obj = this.objects.get(id);
    if (!obj) {
      throw new Error(`Object with id ${id} not found`);
    }

    obj.setAttrs(attrs);
    this.layer.draw();
  }

  /**
   * Removes an object from the canvas
   */
  removeObject(id: string): void {
    const obj = this.objects.get(id);
    if (!obj) {
      return;
    }

    obj.destroy();
    this.objects.delete(id);
    this.layer.draw();
  }

  /**
   * Gets an object by ID
   */
  getObjectById(id: string): Konva.Node | null {
    return this.objects.get(id) || null;
  }

  /**
   * Gets all objects
   */
  getAllObjects(): Konva.Node[] {
    return Array.from(this.objects.values());
  }

  /**
   * Clones an object
   */
  cloneObject(id: string): Konva.Node {
    const obj = this.objects.get(id);
    if (!obj) {
      throw new Error(`Object with id ${id} not found`);
    }

    const cloned = obj.clone();
    cloned.setAttr('id', `${id}-clone-${Date.now()}`);
    cloned.setAttr('x', (obj.x() || 0) + 20);
    cloned.setAttr('y', (obj.y() || 0) + 20);

    this.layer.add(cloned);
    this.objects.set(cloned.id(), cloned);

    return cloned;
  }

  /**
   * Groups multiple objects
   */
  groupObjects(ids: string[]): Konva.Group {
    const nodes: Konva.Node[] = [];

    for (const id of ids) {
      const obj = this.objects.get(id);
      if (obj) {
        nodes.push(obj);
      }
    }

    if (nodes.length === 0) {
      throw new Error('No valid objects to group');
    }

    const group = new Konva.Group({
      id: `group-${Date.now()}-${Math.random()}`,
    });

    // Calculate group bounds
    let minX = Infinity;
    let minY = Infinity;
    let maxX = -Infinity;
    let maxY = -Infinity;

    nodes.forEach((node) => {
      const box = node.getClientRect();
      minX = Math.min(minX, box.x);
      minY = Math.min(minY, box.y);
      maxX = Math.max(maxX, box.x + box.width);
      maxY = Math.max(maxY, box.y + box.height);
    });

    group.position({ x: minX, y: minY });

    nodes.forEach((node) => {
      const pos = node.position();
      node.position({ x: pos.x - minX, y: pos.y - minY });
      node.moveTo(group);
    });

    this.layer.add(group);
    this.objects.set(group.id(), group);

    // Remove individual objects from map (they're now in the group)
    ids.forEach((id) => {
      this.objects.delete(id);
    });

    return group;
  }

  /**
   * Ungroups objects
   */
  ungroupObjects(groupId: string): Konva.Node[] {
    const group = this.objects.get(groupId);
    if (!group || !(group instanceof Konva.Group)) {
      throw new Error(`Group with id ${groupId} not found`);
    }

    const children = group.getChildren().slice();
    const groupPos = group.position();

    children.forEach((child) => {
      const childPos = child.position();
      child.position({
        x: childPos.x + groupPos.x,
        y: childPos.y + groupPos.y,
      });
      child.moveTo(this.layer);
      this.objects.set(child.id(), child);
    });

    group.destroy();
    this.objects.delete(groupId);

    return children;
  }

  /**
   * Sets the layer
   */
  setLayer(layer: Konva.Layer): void {
    this.layer = layer;
  }

  /**
   * Clears all objects
   */
  clear(): void {
    this.objects.forEach((obj) => obj.destroy());
    this.objects.clear();
  }
}
