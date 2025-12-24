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
  filters(): any[];
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
    if (options.background) {
      (textElement as any).fill(options.background);
      (textElement as any).opacity(options.backgroundOpacity || 1);
    }

    // Add shadow if specified
    if (options.shadowColor) {
      (textElement as any).shadowColor(options.shadowColor);
      (textElement as any).shadowBlur(options.shadowBlur || 5);
      (textElement as any).shadowOffset(options.shadowOffset || { x: 2, y: 2 });
      (textElement as any).shadowOpacity(options.shadowOpacity || 0.5);
    }

    // Store original text for editing
    textElement.originalText = text;
    textElement.type = 'text';

    // Add to layer
    this.designLayer.add(textElement as any);
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
    const textPosition = (textElement as any).absolutePosition();
    const stageBox = this.stage.container().getBoundingClientRect();
    const scaleX = this.stage.scaleX();
    const scaleY = this.stage.scaleY();

    textarea.value = (textElement as any).text();
    textarea.style.position = 'absolute';
    textarea.style.top = textPosition.y * scaleY + stageBox.top + 'px';
    textarea.style.left = textPosition.x * scaleX + stageBox.left + 'px';
    textarea.style.width = (textElement as any).width() * scaleX + 'px';
    textarea.style.height = (textElement as any).height() * scaleY + 'px';
    textarea.style.fontSize = (textElement as any).fontSize() * scaleX + 'px';
    textarea.style.fontFamily = (textElement as any).fontFamily();
    textarea.style.fontStyle = (textElement as any).fontStyle();
    textarea.style.fontWeight = (textElement as any).fontStyle().includes('bold') ? 'bold' : 'normal';
    textarea.style.border = 'none';
    textarea.style.padding = '0px';
    textarea.style.margin = '0px';
    textarea.style.overflow = 'hidden';
    textarea.style.background = 'transparent';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.lineHeight = (textElement as any).lineHeight().toString();
    textarea.style.color = (textElement as any).fill();
    textarea.style.textAlign = (textElement as any).align();
    textarea.style.letterSpacing = (textElement as any).letterSpacing() + 'px';

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
        (textElement as any).text(textarea.value);
        this.designLayer.batchDraw();
        removeTextarea();
      }
      // Hide on Escape
      if (e.keyCode === 27) {
        removeTextarea();
      }
    });

    textarea.addEventListener('blur', () => {
      (textElement as any).text(textarea.value);
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
    
    // Add selection visual feedback
    (textElement as any).stroke('#007bff');
    (textElement as any).strokeWidth(2);
    this.designLayer.batchDraw();
  }

  /**
   * Deselect current text
   */
  deselectText() {
    if (this.selectedText) {
      (this.selectedText as any).stroke('');
      (this.selectedText as any).strokeWidth(0);
      this.selectedText = null;
      this.designLayer.batchDraw();
    }
  }

  /**
   * Update text properties
   */
  updateTextProperties(textElement: TextElement, properties: Partial<TextOptions>) {
    if (properties.fontSize !== undefined) (textElement as any).fontSize(properties.fontSize);
    if (properties.fontFamily !== undefined) (textElement as any).fontFamily(properties.fontFamily);
    if (properties.fill !== undefined) (textElement as any).fill(properties.fill);
    if (properties.stroke !== undefined) (textElement as any).stroke(properties.stroke);
    if (properties.strokeWidth !== undefined) (textElement as any).strokeWidth(properties.strokeWidth);
    if (properties.align !== undefined) (textElement as any).align(properties.align);
    if (properties.verticalAlign !== undefined) (textElement as any).verticalAlign(properties.verticalAlign);
    if (properties.fontStyle !== undefined) (textElement as any).fontStyle(properties.fontStyle);
    if (properties.textDecoration !== undefined) (textElement as any).textDecoration(properties.textDecoration);
    if (properties.letterSpacing !== undefined) (textElement as any).letterSpacing(properties.letterSpacing);
    if (properties.lineHeight !== undefined) (textElement as any).lineHeight(properties.lineHeight);
    if (properties.padding !== undefined) (textElement as any).padding(properties.padding);

    // Update shadow
    if (properties.shadowColor !== undefined) (textElement as any).shadowColor(properties.shadowColor);
    if (properties.shadowBlur !== undefined) (textElement as any).shadowBlur(properties.shadowBlur);
    if (properties.shadowOffset !== undefined) (textElement as any).shadowOffset(properties.shadowOffset);
    if (properties.shadowOpacity !== undefined) (textElement as any).shadowOpacity(properties.shadowOpacity);

    this.designLayer.batchDraw();
  }

  /**
   * Delete selected text
   */
  deleteSelectedText() {
    if (this.selectedText) {
      (this.selectedText as any).destroy();
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
    switch (effect) {
      case 'bold': {
        const currentStyle = (textElement as any).fontStyle();
        if (currentStyle.includes('bold')) {
          (textElement as any).fontStyle(currentStyle.replace('bold', '').trim() || 'normal');
        } else {
          (textElement as any).fontStyle(currentStyle ? `${currentStyle} bold` : 'bold');
        }
        break;
      }
      case 'italic': {
        const currentStyleItalic = (textElement as any).fontStyle();
        if (currentStyleItalic.includes('italic')) {
          (textElement as any).fontStyle(currentStyleItalic.replace('italic', '').trim() || 'normal');
        } else {
          (textElement as any).fontStyle(currentStyleItalic ? `${currentStyleItalic} italic` : 'italic');
        }
        break;
      }
      case 'underline':
        (textElement as any).textDecoration((textElement as any).textDecoration() === 'underline' ? 'none' : 'underline');
        break;
      case 'strikethrough':
        (textElement as any).textDecoration((textElement as any).textDecoration() === 'line-through' ? 'none' : 'line-through');
        break;
    }
    this.designLayer.batchDraw();
  }

  /**
   * Duplicate text element
   */
  duplicateText(textElement: TextElement): TextElement {
    const cloned = (textElement as any).clone() as TextElement;
    (cloned as any).x((textElement as any).x() + 20);
    (cloned as any).y((textElement as any).y() + 20);
    (cloned as any).id(`text_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    this.designLayer.add(cloned as any);
    this.designLayer.batchDraw();
    return cloned;
  }
}

export default TextTool;
