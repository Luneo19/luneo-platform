/**
 * TextRenderer
 * Text editing helpers and utilities
 */

import Konva from 'konva';

export interface TextStyle {
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  fontSize?: number;
  fontFamily?: string;
  fill?: string;
  align?: 'left' | 'center' | 'right' | 'justify';
}

export interface TextEditCallbacks {
  onEdit?: (text: string) => void;
  onEditEnd?: (text: string) => void;
}

/**
 * Text rendering and editing utilities
 */
export class TextRenderer {
  private static activeTextarea: HTMLTextAreaElement | null = null;
  private static activeTextNode: Konva.Text | null = null;

  /**
   * Creates an editable text node with double-click editing
   */
  static createEditableText(
    config: Konva.TextConfig,
    callbacks?: TextEditCallbacks
  ): Konva.Text {
    const textNode = new Konva.Text(config);

    textNode.on('dblclick', () => {
      this.startEditing(textNode, callbacks);
    });

    return textNode;
  }

  /**
   * Starts inline editing with HTML textarea overlay
   */
  static startEditing(textNode: Konva.Text, callbacks?: TextEditCallbacks): void {
    if (this.activeTextarea) {
      this.stopEditing();
    }

    const stage = textNode.getStage();
    if (!stage) {
      return;
    }

    const container = stage.container();
    const box = textNode.getClientRect();
    const position = textNode.getAbsolutePosition();

    // Create textarea
    const textarea = document.createElement('textarea');
    textarea.value = textNode.text();
    textarea.style.position = 'absolute';
    textarea.style.top = `${position.y}px`;
    textarea.style.left = `${position.x}px`;
    textarea.style.width = `${box.width}px`;
    textarea.style.height = `${box.height}px`;
    textarea.style.fontSize = `${textNode.fontSize()}px`;
    textarea.style.fontFamily = textNode.fontFamily();
    textarea.style.fontStyle = textNode.fontStyle();
    textarea.style.fontWeight = textNode.fontStyle().includes('bold') ? 'bold' : 'normal';
    textarea.style.textAlign = textNode.align();
    // Convert fill (string | CanvasGradient) to string for CSS
    const fillValue = textNode.fill();
    textarea.style.color = typeof fillValue === 'string' ? fillValue : '#000000';
    textarea.style.border = '2px solid #0099ff';
    textarea.style.padding = '0px';
    textarea.style.margin = '0px';
    textarea.style.overflow = 'hidden';
    textarea.style.background = 'transparent';
    textarea.style.outline = 'none';
    textarea.style.resize = 'none';
    textarea.style.transform = `rotate(${textNode.rotation()}deg)`;
    textarea.style.transformOrigin = 'top left';

    container.appendChild(textarea);
    textarea.focus();
    textarea.select();

    this.activeTextarea = textarea;
    this.activeTextNode = textNode;

    // Handle input
    const handleInput = () => {
      if (!textNode || !textarea) return;

      textNode.text(textarea.value);
      textNode.setAttr('text', textarea.value);

      // Resize textarea to fit content
      const newBox = textNode.getClientRect();
      textarea.style.width = `${newBox.width}px`;
      textarea.style.height = `${newBox.height}px`;

      if (callbacks?.onEdit) {
        callbacks.onEdit(textarea.value);
      }

      stage.batchDraw();
    };

    // Handle blur (end editing)
    const handleBlur = () => {
      if (!textNode || !textarea) return;

      const newText = textarea.value;
      textNode.text(newText);

      if (callbacks?.onEditEnd) {
        callbacks.onEditEnd(newText);
      }

      this.stopEditing();
    };

    // Handle Enter key (finish editing)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        textarea.blur();
      }
      if (e.key === 'Escape') {
        textarea.value = textNode.text();
        textarea.blur();
      }
    };

    textarea.addEventListener('input', handleInput);
    textarea.addEventListener('blur', handleBlur);
    textarea.addEventListener('keydown', handleKeyDown);
  }

  /**
   * Stops editing and removes textarea overlay
   */
  static stopEditing(): void {
    if (this.activeTextarea) {
      this.activeTextarea.remove();
      this.activeTextarea = null;
    }

    if (this.activeTextNode) {
      const stage = this.activeTextNode.getStage();
      if (stage) {
        stage.batchDraw();
      }
      this.activeTextNode = null;
    }
  }

  /**
   * Applies text style to a text node
   */
  static applyTextStyle(textNode: Konva.Text, style: TextStyle): void {
    if (style.fontSize !== undefined) {
      textNode.fontSize(style.fontSize);
    }

    if (style.fontFamily !== undefined) {
      textNode.fontFamily(style.fontFamily);
    }

    if (style.fill !== undefined) {
      textNode.fill(style.fill);
    }

    if (style.align !== undefined) {
      textNode.align(style.align);
    }

    // Handle font style
    let fontStyle = textNode.fontStyle() || 'normal';
    if (style.bold !== undefined) {
      if (style.bold) {
        fontStyle = fontStyle.includes('italic') ? 'bold italic' : 'bold';
      } else {
        fontStyle = fontStyle.replace('bold', '').trim() || 'normal';
        if (fontStyle === '') fontStyle = 'normal';
      }
    }

    if (style.italic !== undefined) {
      if (style.italic) {
        fontStyle = fontStyle.includes('bold') ? 'bold italic' : 'italic';
      } else {
        fontStyle = fontStyle.replace('italic', '').trim() || 'normal';
        if (fontStyle === '') fontStyle = 'normal';
      }
    }

    textNode.fontStyle(fontStyle);

    // Handle underline (using textDecoration)
    if (style.underline !== undefined) {
      textNode.textDecoration(style.underline ? 'underline' : 'none');
    }

    textNode.getLayer()?.draw();
  }

  /**
   * Measures text dimensions
   */
  static measureText(text: string, font: string, fontSize: number): { width: number; height: number } {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');

    if (!context) {
      return { width: 0, height: 0 };
    }

    context.font = `${fontSize}px ${font}`;
    const metrics = context.measureText(text);

    return {
      width: metrics.width,
      height: fontSize * 1.2, // Approximate line height
    };
  }

  /**
   * Checks if text editing is active
   */
  static isEditing(): boolean {
    return this.activeTextarea !== null;
  }
}
