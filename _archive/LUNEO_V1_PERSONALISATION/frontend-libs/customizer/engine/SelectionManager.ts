/**
 * SelectionManager
 * Handles object selection with Transformer
 */

import Konva from 'konva';

export interface SelectionCallbacks {
  onTransformEnd?: (node: Konva.Node) => void;
  onDragEnd?: (node: Konva.Node) => void;
}

/**
 * Manages object selection with Konva Transformer
 */
export class SelectionManager {
  private transformer: Konva.Transformer | null = null;
  private layer: Konva.Layer;
  private selectedNodes: Konva.Node[] = [];
  private callbacks: SelectionCallbacks = {};

  constructor(layer: Konva.Layer) {
    this.layer = layer;
  }

  /**
   * Sets up the Transformer on the layer
   */
  setupTransformer(layer: Konva.Layer): Konva.Transformer {
    this.layer = layer;

    if (this.transformer) {
      this.transformer.destroy();
    }

    this.transformer = new Konva.Transformer({
      rotateEnabled: true,
      enabledAnchors: [
        'top-left',
        'top-center',
        'top-right',
        'middle-right',
        'bottom-right',
        'bottom-center',
        'bottom-left',
        'middle-left',
      ],
      borderEnabled: true,
      borderStroke: '#0099ff',
      borderStrokeWidth: 2,
      anchorFill: '#0099ff',
      anchorStroke: '#ffffff',
      anchorSize: 8,
      anchorCornerRadius: 2,
    });

    this.layer.add(this.transformer);

    // Attach event listeners
    this.transformer.on('transformend', () => {
      if (this.selectedNodes.length === 1 && this.callbacks.onTransformEnd) {
        this.callbacks.onTransformEnd(this.selectedNodes[0]);
      }
    });

    return this.transformer;
  }

  /**
   * Selects a single node
   */
  select(node: Konva.Node): void {
    if (!this.transformer) {
      throw new Error('Transformer not initialized. Call setupTransformer first.');
    }

    this.deselect();
    this.selectedNodes = [node];
    this.transformer.nodes([node]);
    this.transformer.getLayer()?.draw();
  }

  /**
   * Selects multiple nodes
   */
  selectMultiple(nodes: Konva.Node[]): void {
    if (!this.transformer) {
      throw new Error('Transformer not initialized. Call setupTransformer first.');
    }

    if (nodes.length === 0) {
      this.deselect();
      return;
    }

    this.selectedNodes = nodes;
    this.transformer.nodes(nodes);
    this.transformer.getLayer()?.draw();
  }

  /**
   * Deselects all nodes
   */
  deselect(): void {
    if (!this.transformer) {
      return;
    }

    this.transformer.nodes([]);
    this.selectedNodes = [];
    this.transformer.getLayer()?.draw();
  }

  /**
   * Gets currently selected nodes
   */
  getSelection(): Konva.Node[] {
    return [...this.selectedNodes];
  }

  /**
   * Sets callback for transform end event
   */
  onTransformEnd(callback: (node: Konva.Node) => void): void {
    this.callbacks.onTransformEnd = callback;
  }

  /**
   * Sets callback for drag end event
   */
  onDragEnd(callback: (node: Konva.Node) => void): void {
    this.callbacks.onDragEnd = callback;

    // Attach dragend listeners to selected nodes
    this.selectedNodes.forEach((node) => {
      node.off('dragend');
      node.on('dragend', () => {
        callback(node);
      });
    });
  }

  /**
   * Enables or disables rotation
   */
  enableRotation(enable: boolean): void {
    if (!this.transformer) {
      return;
    }

    this.transformer.rotateEnabled(enable);
    this.transformer.getLayer()?.draw();
  }

  /**
   * Enables or disables resizing
   */
  enableResize(enable: boolean): void {
    if (!this.transformer) {
      return;
    }

    if (enable) {
      this.transformer.enabledAnchors([
        'top-left',
        'top-center',
        'top-right',
        'middle-right',
        'bottom-right',
        'bottom-center',
        'bottom-left',
        'middle-left',
      ]);
    } else {
      this.transformer.enabledAnchors([]);
    }

    this.transformer.getLayer()?.draw();
  }

  /**
   * Sets the anchor size
   */
  setAnchorSize(size: number): void {
    if (!this.transformer) {
      return;
    }

    this.transformer.anchorSize(size);
    this.transformer.getLayer()?.draw();
  }

  /**
   * Handles stage click events for selection
   */
  handleStageClick(event: Konva.KonvaEventObject<MouseEvent>): void {
    const stage = event.target.getStage();
    if (!stage) {
      return;
    }

    const clickedOnEmpty = event.target === stage;

    if (clickedOnEmpty) {
      this.deselect();
      return;
    }

    // Find the clicked node (skip transformer and layer)
    let clickedNode: Konva.Node | null = null;
    const pointerPos = stage.getPointerPosition();

    if (!pointerPos) {
      return;
    }

    // Get all nodes at pointer position
    const nodes = stage.find('.konva-node');
    for (const node of nodes) {
      if (node === this.transformer || node.getParent() === this.transformer) {
        continue;
      }

      if (node.hasName('base')) {
        continue;
      }

      const box = node.getClientRect();
      if (
        pointerPos.x >= box.x &&
        pointerPos.x <= box.x + box.width &&
        pointerPos.y >= box.y &&
        pointerPos.y <= box.y + box.height
      ) {
        clickedNode = node;
        break;
      }
    }

    if (clickedNode) {
      // Handle multi-select with shift key
      if (event.evt.shiftKey && this.selectedNodes.includes(clickedNode)) {
        // Deselect if already selected
        this.selectedNodes = this.selectedNodes.filter((n) => n !== clickedNode);
        if (this.selectedNodes.length > 0) {
          this.transformer?.nodes(this.selectedNodes);
        } else {
          this.deselect();
        }
      } else if (event.evt.shiftKey) {
        // Add to selection
        this.selectedNodes.push(clickedNode);
        this.transformer?.nodes(this.selectedNodes);
      } else {
        // Single select
        this.select(clickedNode);
      }
    }
  }

  /**
   * Gets the transformer instance
   */
  getTransformer(): Konva.Transformer | null {
    return this.transformer;
  }

  /**
   * Updates selection when nodes are added/removed
   */
  updateSelection(): void {
    if (!this.transformer) {
      return;
    }

    // Filter out destroyed nodes
    this.selectedNodes = this.selectedNodes.filter((node) => !(node as Konva.Node & { isDestroyed?: () => boolean }).isDestroyed?.());

    if (this.selectedNodes.length > 0) {
      this.transformer.nodes(this.selectedNodes);
    } else {
      this.transformer.nodes([]);
    }

    this.transformer.getLayer()?.draw();
  }

  /**
   * Destroys the transformer
   */
  destroy(): void {
    if (this.transformer) {
      this.transformer.destroy();
      this.transformer = null;
    }

    this.selectedNodes = [];
    this.callbacks = {};
  }
}
