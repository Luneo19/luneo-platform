import Konva from 'konva';
import { Stage } from 'konva/lib/Stage';
import { Layer } from 'konva/lib/Layer';

export interface TextOptions {
  text?: string;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  x?: number;
  y?: number;
  width?: number;
  height?: number;
  align?: 'left' | 'center' | 'right';
  verticalAlign?: 'top' | 'middle' | 'bottom';
  fontStyle?: 'normal' | 'bold' | 'italic' | 'bold italic';
  textDecoration?: 'none' | 'underline' | 'line-through';
  letterSpacing?: number;
  lineHeight?: number;
  padding?: number;
  background?: string;
  backgroundOpacity?: number;
  shadowColor?: string;
  shadowBlur?: number;
  shadowOffset?: { x: number; y: number };
  shadowOpacity?: number;
}

export interface TextElement {
  id: string;
  type: 'text';
  originalText: string;
  // Konva Text properties
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
  clone(): TextElement;
  getClassName(): string;
  text(): string;
  fontSize(): number;
  fontFamily(): string;
  fontStyle(): string;
  fontVariant(): string;
  fontWeight(): string;
  lineHeight(): number;
  letterSpacing(): number;
  textDecoration(): string;
  textAlign(): string;
  verticalAlign(): string;
  padding(): number;
}

export class TextTool {
  private stage: Stage;
  private designLayer: Layer;
  private selectedText: TextElement | null = null;
  private isEditing: boolean = false;
  private textNode: Konva.Text | null = null;

  constructor(stage: Stage, designLayer: Layer) {
    this.stage = stage;
    this.designLayer = designLayer;
    this.setupEventListeners();
  }

  private setupEventListeners() {
    // Double-click to edit text
    this.stage.on('dblclick', (e) => {
      const clickedOnEmpty = e.target === this.stage;
      if (clickedOnEmpty) {
        this.addText('Double-click to edit', {
          x: e.evt.offsetX,
          y: e.evt.offsetY,
        });
      } else if (e.target instanceof Konva.Text) {
        this.editText(e.target as unknown as TextElement);
      }
    });

    // Click to select text
    this.stage.on('click', (e) => {
      if (e.target instanceof Konva.Text) {
        this.selectText(e.target as unknown as TextElement);
      } else {
        this.deselectText();
      }
    });
  }

  /**
   * Add new text element to canvas
   */
  addText(text: string = 'Your Text', options: TextOptions = {}): TextElement {
    const textElement = new Konva.Text({
      text,
      fontSize: options.fontSize || 24,
      fontFamily: options.fontFamily || 'Arial',
      fill: options.fill || '#000000',
      stroke: options.stroke,
      strokeWidth: options.strokeWidth || 0,
      x: options.x || 50,
      y: options.y || 50,
      width: options.width,
      height: options.height,
      align: options.align || 'left',
      verticalAlign: options.verticalAlign || 'top',
      fontStyle: options.fontStyle || 'normal',
      textDecoration: options.textDecoration || 'none',
      letterSpacing: options.letterSpacing || 0,
      lineHeight: options.lineHeight || 1.2,
      padding: options.padding || 0,
      draggable: true,
      id: `text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    }) as unknown as TextElement;

    // Add background if specified
    const konvaText = textElement as unknown as Konva.Text;
    if (options.background) {
      konvaText.fill(options.background);
      konvaText.opacity(options.backgroundOpacity ?? 1);
    }

    // Add shadow if specified
    if (options.shadowColor) {
      konvaText.shadowColor(options.shadowColor);
      konvaText.shadowBlur(options.shadowBlur ?? 5);
      konvaText.shadowOffset(options.shadowOffset ?? { x: 2, y: 2 });
      konvaText.shadowOpacity(options.shadowOpacity ?? 0.5);
    }

    // Store original text for editing
    textElement.originalText = text;
    textElement.type = 'text';

    // Add to layer
    this.designLayer.add(textElement as unknown as Konva.Shape);
    this.designLayer.batchDraw();

    // Select the new text
    this.selectText(textElement);

    return textElement;
  }

  /**
   * Edit existing text element
   */
  editText(textElement: TextElement) {
    if (this.isEditing) return;

    this.isEditing = true;
    this.selectedText = textElement;

    // Create textarea for editing
    const textarea = document.createElement('textarea');
    document.body.appendChild(textarea);

    // Position textarea
    const node = textElement as unknown as Konva.Text;
    const textPosition = node.absolutePosition();
    const stageBox = this.stage.container().getBoundingClientRect();
    const scaleX = Number(this.stage.scaleX()) || 1;
    const scaleY = Number(this.stage.scaleY()) || 1;

    textarea.value = textElement.text();
    textarea.style.position = 'absolute';
    textarea.style.top = textPosition.y * scaleY + stageBox.top + 'px';
    textarea.style.left = textPosition.x * scaleX + stageBox.left + 'px';
    textarea.style.width = (Number(textElement.width()) || 100) * scaleX + 'px';
    textarea.style.height = (Number(textElement.height()) || 20) * scaleY + 'px';
    textarea.style.fontSize = textElement.fontSize() * scaleX + 'px';
    textarea.style.fontFamily = textElement.fontFamily();
    textarea.style.fontStyle = textElement.fontStyle();
    textarea.style.fontWeight = textElement.fontStyle().includes('bold') ? 'bold' : 'normal';
    textarea.style.border = 'none';
    textarea.style.padding = '0px';
    textarea.style.margin = '0px';
    textarea.style.overflow = 'hidden';
    textarea.style.background = 'transparent';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.lineHeight = textElement.lineHeight().toString();
    textarea.style.color = textElement.fill();
    textarea.style.textAlign = node.align();
    textarea.style.letterSpacing = textElement.letterSpacing() + 'px';

    // Focus and select
    textarea.focus();
    textarea.select();

    // Handle textarea events
    const removeTextarea = () => {
      textarea.remove();
      this.isEditing = false;
      this.stage.container().focus();
    };

    textarea.addEventListener('keydown', (e) => {
      // Hide on Enter (without Shift)
      if (e.keyCode === 13 && !e.shiftKey) {
        (textElement as unknown as Konva.Text).text(textarea.value);
        this.designLayer.batchDraw();
        removeTextarea();
      }
      // Hide on Escape
      if (e.keyCode === 27) {
        removeTextarea();
      }
    });

    textarea.addEventListener('blur', () => {
      (textElement as unknown as Konva.Text).text(textarea.value);
      this.designLayer.batchDraw();
      removeTextarea();
    });

    // Auto-resize textarea
    const autoResize = () => {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    };

    textarea.addEventListener('input', autoResize);
    autoResize();
  }

  /**
   * Select text element
   */
  selectText(textElement: TextElement) {
    this.deselectText();
    this.selectedText = textElement;
    const node = textElement as unknown as Konva.Text;
    node.stroke('#007bff');
    node.strokeWidth(2);
    this.designLayer.batchDraw();
  }

  /**
   * Deselect current text
   */
  deselectText() {
    if (this.selectedText) {
      const node = this.selectedText as unknown as Konva.Text;
      node.stroke('');
      node.strokeWidth(0);
      this.selectedText = null;
      this.designLayer.batchDraw();
    }
  }

  /**
   * Update text properties
   */
  updateTextProperties(textElement: TextElement, properties: Partial<TextOptions>) {
    const node = textElement as unknown as Konva.Text;
    if (properties.fontSize !== undefined) node.fontSize(properties.fontSize);
    if (properties.fontFamily !== undefined) node.fontFamily(properties.fontFamily);
    if (properties.fill !== undefined) node.fill(properties.fill);
    if (properties.stroke !== undefined) node.stroke(properties.stroke);
    if (properties.strokeWidth !== undefined) node.strokeWidth(properties.strokeWidth);
    if (properties.align !== undefined) node.align(properties.align);
    if (properties.verticalAlign !== undefined) node.verticalAlign(properties.verticalAlign);
    if (properties.fontStyle !== undefined) node.fontStyle(properties.fontStyle);
    if (properties.textDecoration !== undefined) node.textDecoration(properties.textDecoration);
    if (properties.letterSpacing !== undefined) node.letterSpacing(properties.letterSpacing);
    if (properties.lineHeight !== undefined) node.lineHeight(properties.lineHeight);
    if (properties.padding !== undefined) node.padding(properties.padding);

    if (properties.shadowColor !== undefined) node.shadowColor(properties.shadowColor);
    if (properties.shadowBlur !== undefined) node.shadowBlur(properties.shadowBlur);
    if (properties.shadowOffset !== undefined) node.shadowOffset(properties.shadowOffset);
    if (properties.shadowOpacity !== undefined) node.shadowOpacity(properties.shadowOpacity);

    this.designLayer.batchDraw();
  }

  /**
   * Delete selected text
   */
  deleteSelectedText() {
    if (this.selectedText) {
      (this.selectedText as unknown as Konva.Text).destroy();
      this.selectedText = null;
      this.designLayer.batchDraw();
    }
  }

  /**
   * Get all text elements
   */
  getAllTextElements(): TextElement[] {
    return this.designLayer.children
      .filter((node) => node instanceof Konva.Text)
      .map((node) => node as unknown as TextElement);
  }

  /**
   * Get selected text element
   */
  getSelectedText(): TextElement | null {
    return this.selectedText;
  }

  /**
   * Check if currently editing
   */
  isCurrentlyEditing(): boolean {
    return this.isEditing;
  }

  /**
   * Apply text effects
   */
  applyTextEffect(textElement: TextElement, effect: 'bold' | 'italic' | 'underline' | 'strikethrough') {
    const node = textElement as unknown as Konva.Text;
    switch (effect) {
      case 'bold': {
        const currentStyle = textElement.fontStyle();
        if (currentStyle.includes('bold')) {
          node.fontStyle(currentStyle.replace('bold', '').trim() || 'normal');
        } else {
          node.fontStyle(currentStyle ? `${currentStyle} bold` : 'bold');
        }
        break;
      }
      case 'italic': {
        const currentStyleItalic = textElement.fontStyle();
        if (currentStyleItalic.includes('italic')) {
          node.fontStyle(currentStyleItalic.replace('italic', '').trim() || 'normal');
        } else {
          node.fontStyle(currentStyleItalic ? `${currentStyleItalic} italic` : 'italic');
        }
        break;
      }
      case 'underline':
        node.textDecoration(textElement.textDecoration() === 'underline' ? 'none' : 'underline');
        break;
      case 'strikethrough':
        node.textDecoration(textElement.textDecoration() === 'line-through' ? 'none' : 'line-through');
        break;
    }
    this.designLayer.batchDraw();
  }

  /**
   * Duplicate text element
   */
  duplicateText(textElement: TextElement): TextElement {
    const node = textElement as unknown as Konva.Text;
    const cloned = node.clone() as unknown as TextElement;
    const cloneNode = cloned as unknown as Konva.Text;
    cloneNode.x((Number(node.x()) || 0) + 20);
    cloneNode.y((Number(node.y()) || 0) + 20);
    cloneNode.id(`text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    this.designLayer.add(cloneNode);
    this.designLayer.batchDraw();
    return cloned;
  }
}

export default TextTool;
