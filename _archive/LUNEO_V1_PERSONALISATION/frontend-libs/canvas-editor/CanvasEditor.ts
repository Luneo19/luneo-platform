/**
 * CANVAS EDITOR - Core Engine
 * Powered by Konva.js
 * Luneo Product Customizer WYSIWYG
 */

import Konva from 'konva';

export interface EditorConfig {
  width: number;
  height: number;
  dpi: number;
  colorMode: 'RGB' | 'CMYK';
  bleed: number; // mm
  containerId: string;
}

export interface DesignElement {
  id: string;
  type: 'text' | 'image' | 'shape' | 'clipart';
  data: Record<string, unknown>;
}

export class CanvasEditor {
  private stage: Konva.Stage;
  private backgroundLayer: Konva.Layer;
  private mainLayer: Konva.Layer;
  private transformer: Konva.Transformer;
  private config: EditorConfig;
  
  // History management
  private history: string[] = [];
  private historyStep: number = 0;
  private maxHistory: number = 50;
  
  // Selection
  private selectedNode: Konva.Node | null = null;
  
  // Callbacks
  private onSelectionChange?: (node: Konva.Node | null) => void;
  private onHistoryChange?: (canUndo: boolean, canRedo: boolean) => void;
  
  constructor(config: EditorConfig) {
    this.config = config;
    
    // Create Konva stage
    this.stage = new Konva.Stage({
      container: config.containerId,
      width: config.width,
      height: config.height,
    });
    
    // Create background layer (product image)
    this.backgroundLayer = new Konva.Layer({
      listening: false, // Background not interactive
    });
    this.stage.add(this.backgroundLayer);
    
    // Create main layer (user designs)
    this.mainLayer = new Konva.Layer();
    this.stage.add(this.mainLayer);
    
    // Create transformer (selection tool)
    this.transformer = new Konva.Transformer({
      keepRatio: false,
      enabledAnchors: [
        'top-left',
        'top-center',
        'top-right',
        'middle-left',
        'middle-right',
        'bottom-left',
        'bottom-center',
        'bottom-right',
      ],
      rotateEnabled: true,
      borderStroke: '#4a90e2',
      borderStrokeWidth: 2,
      anchorFill: '#4a90e2',
      anchorStroke: '#ffffff',
      anchorSize: 10,
      anchorCornerRadius: 2,
      padding: 5,
    });
    this.mainLayer.add(this.transformer);
    
    // Setup event listeners
    this.setupEventListeners();
    
    // Save initial state
    this.saveHistory();
  }
  
  /**
   * Setup all event listeners
   */
  private setupEventListeners(): void {
    // Click on empty space deselects
    this.stage.on('click tap', (e) => {
      if (e.target === this.stage) {
        this.deselectAll();
      }
    });
    
    // Selection management
    this.stage.on('click tap', (e) => {
      const target = e.target;
      
      // Don't select background or stage
      if (target === this.stage || target.getLayer() === this.backgroundLayer) {
        return;
      }
      
      // Don't select transformer
      if (target.getClassName && target.getClassName() === 'Transformer') {
        return;
      }
      
      this.selectNode(target);
    });
    
    // Delete key removes selected
    window.addEventListener('keydown', this.handleKeyDown);
  }
  
  /**
   * Handle keyboard shortcuts
   */
  private handleKeyDown = (e: KeyboardEvent): void => {
    // Delete/Backspace - Remove selected
    if (e.key === 'Delete' || e.key === 'Backspace') {
      if (this.selectedNode && document.activeElement?.tagName !== 'INPUT') {
        this.deleteSelected();
      }
    }
    
    // Ctrl/Cmd + Z - Undo
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
      e.preventDefault();
      this.undo();
    }
    
    // Ctrl/Cmd + Shift + Z or Ctrl/Cmd + Y - Redo
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
      e.preventDefault();
      this.redo();
    }
    
    // Ctrl/Cmd + C - Copy
    if ((e.ctrlKey || e.metaKey) && e.key === 'c') {
      if (this.selectedNode && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        this.copy();
      }
    }
    
    // Ctrl/Cmd + V - Paste
    if ((e.ctrlKey || e.metaKey) && e.key === 'v') {
      if (document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault();
        this.paste();
      }
    }
  };
  
  /**
   * Set background image (product base)
   */
  setBackgroundImage(imageUrl: string): Promise<void> {
    return new Promise((resolve, reject) => {
      Konva.Image.fromURL(imageUrl, (image) => {
        // Clear existing background
        this.backgroundLayer.destroyChildren();
        
        // Scale to fit canvas
        const scale = Math.min(
          this.config.width / image.width(),
          this.config.height / image.height()
        );
        
        image.scale({ x: scale, y: scale });
        image.position({
          x: (this.config.width - image.width() * scale) / 2,
          y: (this.config.height - image.height() * scale) / 2,
        });
        
        this.backgroundLayer.add(image);
        this.backgroundLayer.batchDraw();
        
        resolve();
      }, (error) => {
        reject(error);
      });
    });
  }

  /**
   * Remplir le fond avec un motif doux (utilisé lorsque le produit n'a pas d'image)
   */
  fillWithPattern(width: number, height: number, color: string = '#F3F4F6'): void {
    const patternWidth = Math.max(width, this.config.width);
    const patternHeight = Math.max(height, this.config.height);
    const offsetX = (this.config.width - patternWidth) / 2;
    const offsetY = (this.config.height - patternHeight) / 2;
    const highlightColor = this.adjustColor(color, 12);
    const shadowColor = this.adjustColor(color, -8);

    this.backgroundLayer.destroyChildren();

    const baseRect = new Konva.Rect({
      x: offsetX,
      y: offsetY,
      width: patternWidth,
      height: patternHeight,
      fill: color,
      listening: false,
    });

    const gradientOverlay = new Konva.Rect({
      x: offsetX,
      y: offsetY,
      width: patternWidth,
      height: patternHeight,
      fillLinearGradientStartPoint: { x: offsetX, y: offsetY },
      fillLinearGradientEndPoint: { x: offsetX + patternWidth, y: offsetY + patternHeight },
      fillLinearGradientColorStops: [0, highlightColor, 1, shadowColor],
      opacity: 0.8,
      listening: false,
    });

    const gridGroup = new Konva.Group({ listening: false, opacity: 0.35 });
    const step = Math.max(40, Math.min(patternWidth, patternHeight) / 10);

    for (let x = offsetX; x <= offsetX + patternWidth; x += step) {
      gridGroup.add(new Konva.Line({
        points: [x, offsetY, x, offsetY + patternHeight],
        stroke: shadowColor,
        strokeWidth: 1,
        dash: [10, 8],
      }));
    }

    for (let y = offsetY; y <= offsetY + patternHeight; y += step) {
      gridGroup.add(new Konva.Line({
        points: [offsetX, y, offsetX + patternWidth, y],
        stroke: highlightColor,
        strokeWidth: 1,
        dash: [8, 12],
      }));
    }

    this.backgroundLayer.add(baseRect);
    this.backgroundLayer.add(gradientOverlay);
    this.backgroundLayer.add(gridGroup);
    this.backgroundLayer.batchDraw();
    this.saveHistory();
  }
  
  /**
   * Add text to canvas
   */
  addText(
    text: string = 'Your Text',
    options: {
      x?: number;
      y?: number;
      fontSize?: number;
      fontFamily?: string;
      fill?: string;
      align?: 'left' | 'center' | 'right';
      fontStyle?: 'normal' | 'bold' | 'italic';
    } = {}
  ): Konva.Text {
    const textNode = new Konva.Text({
      text,
      x: options.x ?? this.config.width / 2 - 50,
      y: options.y ?? this.config.height / 2,
      fontSize: options.fontSize ?? 30,
      fontFamily: options.fontFamily ?? 'Arial',
      fill: options.fill ?? '#000000',
      align: options.align ?? 'left',
      fontStyle: options.fontStyle ?? 'normal',
      draggable: true,
      name: 'text-element',
    });
    
    this.mainLayer.add(textNode);
    this.selectNode(textNode);
    this.mainLayer.batchDraw();
    this.saveHistory();
    
    return textNode;
  }
  
  /**
   * Add image to canvas
   */
  addImage(imageSource: string | HTMLImageElement): Promise<Konva.Image> {
    return new Promise((resolve, reject) => {
      Konva.Image.fromURL(imageSource as string, (image) => {
        // Scale image if too large
        const maxSize = Math.min(this.config.width, this.config.height) / 2;
        const scale = Math.min(
          maxSize / image.width(),
          maxSize / image.height(),
          1 // Don't upscale
        );
        
        image.scale({ x: scale, y: scale });
        image.position({
          x: this.config.width / 2 - (image.width() * scale) / 2,
          y: this.config.height / 2 - (image.height() * scale) / 2,
        });
        image.draggable(true);
        image.name('image-element');
        
        this.mainLayer.add(image);
        this.selectNode(image);
        this.mainLayer.batchDraw();
        this.saveHistory();
        
        resolve(image);
      }, (error) => {
        reject(error);
      });
    });
  }
  
  /**
   * Add shape to canvas
   */
  addShape(
    type: 'rect' | 'circle' | 'star' | 'polygon',
    options: {
      x?: number;
      y?: number;
      fill?: string;
      stroke?: string;
      strokeWidth?: number;
    } = {}
  ): Konva.Shape {
    let shape: Konva.Shape;
    
    const baseOptions = {
      x: options.x ?? this.config.width / 2,
      y: options.y ?? this.config.height / 2,
      fill: options.fill ?? '#3b82f6',
      stroke: options.stroke ?? '#1e40af',
      strokeWidth: options.strokeWidth ?? 2,
      draggable: true,
      name: `${type}-element`,
    };
    
    switch (type) {
      case 'rect':
        shape = new Konva.Rect({
          ...baseOptions,
          width: 100,
          height: 100,
        });
        break;
        
      case 'circle':
        shape = new Konva.Circle({
          ...baseOptions,
          radius: 50,
        });
        break;
        
      case 'star':
        shape = new Konva.Star({
          ...baseOptions,
          numPoints: 5,
          innerRadius: 20,
          outerRadius: 40,
        });
        break;
        
      case 'polygon':
        shape = new Konva.RegularPolygon({
          ...baseOptions,
          sides: 6,
          radius: 50,
        });
        break;
        
      default:
        throw new Error(`Unknown shape type: ${type}`);
    }
    
    this.mainLayer.add(shape);
    this.selectNode(shape);
    this.mainLayer.batchDraw();
    this.saveHistory();
    
    return shape;
  }
  
  /**
   * Select a node
   */
  selectNode(node: Konva.Node | null): void {
    if (node) {
      this.transformer.nodes([node]);
      this.selectedNode = node;
    } else {
      this.transformer.nodes([]);
      this.selectedNode = null;
    }
    
    this.onSelectionChange?.(this.selectedNode);
  }
  
  /**
   * Deselect all
   */
  deselectAll(): void {
    this.selectNode(null);
  }
  
  /**
   * Get selected node
   */
  getSelected(): Konva.Node | null {
    return this.selectedNode;
  }
  
  /**
   * Update selected node properties
   */
  updateSelected(props: Record<string, unknown>): void {
    if (!this.selectedNode) return;
    
    this.selectedNode.setAttrs(props);
    this.mainLayer.batchDraw();
    this.saveHistory();
  }
  
  /**
   * Delete selected node
   */
  deleteSelected(): void {
    if (!this.selectedNode) return;
    
    this.selectedNode.destroy();
    this.deselectAll();
    this.mainLayer.batchDraw();
    this.saveHistory();
  }
  
  /**
   * Copy selected node (to clipboard)
   */
  private copiedNode: Konva.Node | null = null;
  
  copy(): void {
    if (!this.selectedNode) return;
    this.copiedNode = this.selectedNode.clone();
  }
  
  /**
   * Paste copied node
   */
  paste(): void {
    if (!this.copiedNode) return;
    
    const clone = this.copiedNode.clone();
    clone.position({
      x: this.copiedNode.x() + 20,
      y: this.copiedNode.y() + 20,
    });
    
    this.mainLayer.add(clone);
    this.selectNode(clone);
    this.mainLayer.batchDraw();
    this.saveHistory();
  }
  
  /**
   * Bring to front
   */
  bringToFront(): void {
    if (!this.selectedNode) return;
    this.selectedNode.moveToTop();
    this.transformer.moveToTop();
    this.mainLayer.batchDraw();
    this.saveHistory();
  }
  
  /**
   * Send to back
   */
  sendToBack(): void {
    if (!this.selectedNode) return;
    this.selectedNode.moveToBottom();
    this.mainLayer.batchDraw();
    this.saveHistory();
  }
  
  /**
   * Export as high-res PNG (print-ready)
   */
  exportPNG(dpi: number = 300): string {
    const scale = dpi / 72; // 72 is default screen DPI
    
    const dataURL = this.stage.toDataURL({
      pixelRatio: scale,
      mimeType: 'image/png',
      quality: 1,
    });
    
    return dataURL;
  }
  
  /**
   * Export as JSON (save design)
   */
  exportJSON(): string {
    return this.stage.toJSON();
  }
  
  /**
   * Load from JSON (restore design)
   */
  loadJSON(json: string): void {
    // Parse JSON and recreate stage
    const stageData = JSON.parse(json);
    
    // Clear current layers
    this.mainLayer.destroyChildren();
    this.backgroundLayer.destroyChildren();
    
    // Recreate nodes
    const mainLayerData = stageData.children.find((c: { className?: string; attrs?: { name?: string } }) => c.className === 'Layer' && c.attrs?.name !== 'background');
    const backgroundLayerData = stageData.children.find((c: { attrs?: { name?: string } }) => c.attrs?.name === 'background');
    
    if (mainLayerData && 'children' in mainLayerData && Array.isArray(mainLayerData.children)) {
      mainLayerData.children.forEach((nodeData: Record<string, unknown>) => {
        if (nodeData.className === 'Transformer') return;
        
        const node = Konva.Node.create(nodeData);
        this.mainLayer.add(node);
      });
    }
    
    if (backgroundLayerData && 'children' in backgroundLayerData && Array.isArray(backgroundLayerData.children)) {
      backgroundLayerData.children.forEach((nodeData: Record<string, unknown>) => {
        const node = Konva.Node.create(nodeData);
        this.backgroundLayer.add(node);
      });
    }
    
    // Re-add transformer
    this.mainLayer.add(this.transformer);
    this.stage.batchDraw();
  }
  
  /**
   * Save current state to history
   */
  private saveHistory(): void {
    const json = this.exportJSON();
    
    // Remove future history if we're not at the end
    if (this.historyStep < this.history.length - 1) {
      this.history = this.history.slice(0, this.historyStep + 1);
    }
    
    // Add new state
    this.history.push(json);
    
    // Limit history size
    if (this.history.length > this.maxHistory) {
      this.history.shift();
    } else {
      this.historyStep++;
    }
    
    this.notifyHistoryChange();
  }
  
  /**
   * Undo last action
   */
  undo(): void {
    if (!this.canUndo()) return;
    
    this.historyStep--;
    this.loadJSON(this.history[this.historyStep]);
    this.deselectAll();
    this.notifyHistoryChange();
  }
  
  /**
   * Redo last undone action
   */
  redo(): void {
    if (!this.canRedo()) return;
    
    this.historyStep++;
    this.loadJSON(this.history[this.historyStep]);
    this.deselectAll();
    this.notifyHistoryChange();
  }
  
  /**
   * Can undo?
   */
  canUndo(): boolean {
    return this.historyStep > 0;
  }
  
  /**
   * Can redo?
   */
  canRedo(): boolean {
    return this.historyStep < this.history.length - 1;
  }
  
  /**
   * Notify history change
   */
  private notifyHistoryChange(): void {
    this.onHistoryChange?.(this.canUndo(), this.canRedo());
  }
  
  /**
   * Get all elements (for export metadata)
   */
  getAllElements(): DesignElement[] {
    const elements: DesignElement[] = [];
    
    this.mainLayer.children.forEach((node) => {
      if (node === this.transformer) return;
      
      let type: 'text' | 'image' | 'shape' | 'clipart' = 'shape';
      if (node.getClassName() === 'Text') type = 'text';
      else if (node.getClassName() === 'Image') type = 'image';
      
      elements.push({
        id: node.id() || node._id.toString(),
        type,
        data: JSON.parse(node.toJSON()) as Record<string, unknown>,
      });
    });
    
    return elements;
  }
  
  /**
   * Clear canvas (keep background)
   */
  clear(): void {
    this.mainLayer.destroyChildren();
    this.mainLayer.add(this.transformer);
    this.deselectAll();
    this.mainLayer.batchDraw();
    this.saveHistory();
  }
  
  /**
   * Set callbacks
   */
  onSelection(callback: (node: Konva.Node | null) => void): void {
    this.onSelectionChange = callback;
  }
  
  onHistory(callback: (canUndo: boolean, canRedo: boolean) => void): void {
    this.onHistoryChange = callback;
  }
  
  /**
   * Get stage dimensions
   */
  getDimensions(): { width: number; height: number } {
    return {
      width: this.config.width,
      height: this.config.height,
    };
  }
  
  /**
   * Resize stage
   */
  resize(width: number, height: number): void {
    this.stage.width(width);
    this.stage.height(height);
    this.config.width = width;
    this.config.height = height;
    this.stage.batchDraw();
  }
  
  /**
   * Destroy editor (cleanup)
   */
  destroy(): void {
    window.removeEventListener('keydown', this.handleKeyDown);
    this.stage.destroy();
  }

  /**
   * Ajuster une couleur hexadécimale en pourcentage
   */
  private adjustColor(color: string, percent: number): string {
    const hex = color.replace('#', '');
    if (hex.length !== 6) {
      return color;
    }

    const num = parseInt(hex, 16);
    const clamp = (value: number) => Math.min(255, Math.max(0, value));
    const delta = (percent / 100) * 255;

    const r = clamp(((num >> 16) & 0xff) + delta);
    const g = clamp(((num >> 8) & 0xff) + delta);
    const b = clamp((num & 0xff) + delta);

    const newColor = (Math.round(r) << 16) | (Math.round(g) << 8) | Math.round(b);
    return `#${newColor.toString(16).padStart(6, '0')}`.toUpperCase();
  }
}

