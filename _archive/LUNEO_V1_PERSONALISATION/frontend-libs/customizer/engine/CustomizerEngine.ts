/**
 * CustomizerEngine
 * Main orchestrator class for the canvas editor
 */

import Konva from 'konva';
import { CanvasManager } from './CanvasManager';
import { ObjectManager } from './ObjectManager';
import { SelectionManager } from './SelectionManager';
import { HistoryManager } from './HistoryManager';
import type { ZoneConfig } from '../types';

export interface EngineConfig {
  zones?: ZoneConfig[];
  canvas?: {
    width?: number;
    height?: number;
    backgroundColor?: string;
    backgroundImage?: string;
  };
  history?: {
    maxSize?: number;
  };
}

export interface ExportOptions {
  format?: 'png' | 'jpeg' | 'webp';
  quality?: number;
  pixelRatio?: number;
  mimeType?: string;
}

/**
 * Main engine class that orchestrates all canvas operations
 */
export class CustomizerEngine {
  private canvasManager: CanvasManager;
  private objectManager: ObjectManager | null = null;
  private selectionManager: SelectionManager | null = null;
  private historyManager: HistoryManager;
  private config: EngineConfig;
  private stage: Konva.Stage | null = null;
  private baseLayer: Konva.Layer | null = null;

  constructor(config: EngineConfig = {}) {
    this.config = config;
    this.canvasManager = new CanvasManager();
    this.historyManager = new HistoryManager(config.history?.maxSize || 100);
  }

  /**
   * Initializes the engine with a Konva Stage
   */
  initialize(stage: Konva.Stage): void {
    this.stage = stage;
    this.baseLayer = stage.findOne('.base') as Konva.Layer;

    if (!this.baseLayer) {
      // Create base layer if it doesn't exist
      this.baseLayer = new Konva.Layer({ name: 'base' });
      stage.add(this.baseLayer);
    }

    // Initialize managers
    this.objectManager = new ObjectManager(this.baseLayer);
    this.selectionManager = new SelectionManager(this.baseLayer);
    this.selectionManager.setupTransformer(this.baseLayer);

    // Set stage reference for history manager
    this.historyManager.setStage(stage);

    // Setup initial state
    if (this.config.canvas) {
      if (this.config.canvas.width && this.config.canvas.height) {
        this.canvasManager.resize(this.config.canvas.width, this.config.canvas.height);
      }
      if (this.config.canvas.backgroundColor || this.config.canvas.backgroundImage) {
        this.canvasManager.setBackground(
          this.config.canvas.backgroundImage || this.config.canvas.backgroundColor || null
        );
      }
    }

    // Save initial state
    this.historyManager.saveState('Initial state');
  }

  /**
   * Disposes of all resources
   */
  dispose(): void {
    if (this.selectionManager) {
      this.selectionManager.destroy();
      this.selectionManager = null;
    }

    if (this.objectManager) {
      this.objectManager.clear();
      this.objectManager = null;
    }

    this.historyManager.clearHistory();
    this.canvasManager.destroy();

    this.stage = null;
    this.baseLayer = null;
  }

  /**
   * Gets the Konva Stage instance
   */
  getStage(): Konva.Stage | null {
    return this.stage || this.canvasManager.getStage();
  }

  /**
   * Gets the canvas manager
   */
  getCanvasManager(): CanvasManager {
    return this.canvasManager;
  }

  /**
   * Gets the object manager
   */
  getObjectManager(): ObjectManager | null {
    return this.objectManager;
  }

  /**
   * Gets the selection manager
   */
  getSelectionManager(): SelectionManager | null {
    return this.selectionManager;
  }

  /**
   * Gets the history manager
   */
  getHistoryManager(): HistoryManager {
    return this.historyManager;
  }

  /**
   * Serializes the canvas state to JSON
   */
  toJSON(): string {
    if (!this.stage) {
      throw new Error('Engine not initialized. Call initialize first.');
    }

    return JSON.stringify(this.stage.toJSON());
  }

  /**
   * Restores canvas state from JSON
   */
  fromJSON(data: string): void {
    if (!this.stage) {
      throw new Error('Engine not initialized. Call initialize first.');
    }

    try {
      const json = JSON.parse(data);
      const container = this.stage.container();
      const width = this.stage.width();
      const height = this.stage.height();
      
      this.stage.destroyChildren();
      // Konva.Stage.fromObject doesn't exist, use Node.create instead
      const restoredStage = Konva.Node.create(json) as Konva.Stage;
      if (restoredStage) {
        restoredStage.container(container);
        restoredStage.width(width);
        restoredStage.height(height);
        this.stage = restoredStage;
      } else {
        // Fallback: create new stage
        this.stage = new Konva.Stage({
          container,
          width,
          height,
        });
      }

      // Reinitialize managers with new stage
      this.baseLayer = this.stage.findOne('.base') as Konva.Layer;
      if (this.baseLayer) {
        if (this.objectManager) {
          this.objectManager.setLayer(this.baseLayer);
        }
        if (this.selectionManager) {
          this.selectionManager.setupTransformer(this.baseLayer);
        }
      }

      this.historyManager.setStage(this.stage);
    } catch (error) {
      throw new Error(`Failed to restore from JSON: ${error}`);
    }
  }

  /**
   * Exports canvas to data URL
   */
  async exportToDataURL(options?: ExportOptions): Promise<string> {
    if (!this.stage) {
      throw new Error('Engine not initialized. Call initialize first.');
    }

    return this.canvasManager.toDataURL(options);
  }

  /**
   * Exports canvas to Blob
   */
  async exportToBlob(options?: ExportOptions): Promise<Blob> {
    if (!this.stage) {
      throw new Error('Engine not initialized. Call initialize first.');
    }

    return this.canvasManager.toBlob(options);
  }

  /**
   * Saves current state to history
   */
  saveState(label: string = 'State'): void {
    this.historyManager.saveState(label);
  }

  /**
   * Undoes the last action
   */
  undo(): boolean {
    const result = this.historyManager.undo();
    if (result) {
      // Update stage reference after restoration
      const restoredStage = this.historyManager.getStage();
      if (restoredStage) {
        this.stage = restoredStage;
        this.baseLayer = this.stage.findOne('.base') as Konva.Layer;
        
        // Reinitialize managers with restored stage
        if (this.baseLayer) {
          if (this.objectManager) {
            this.objectManager.setLayer(this.baseLayer);
          }
          if (this.selectionManager) {
            this.selectionManager.setupTransformer(this.baseLayer);
          }
        }
        
        if (this.selectionManager) {
          this.selectionManager.updateSelection();
        }
      }
    }
    return result;
  }

  /**
   * Redoes the last undone action
   */
  redo(): boolean {
    const result = this.historyManager.redo();
    if (result) {
      // Update stage reference after restoration
      const restoredStage = this.historyManager.getStage();
      if (restoredStage) {
        this.stage = restoredStage;
        this.baseLayer = this.stage.findOne('.base') as Konva.Layer;
        
        // Reinitialize managers with restored stage
        if (this.baseLayer) {
          if (this.objectManager) {
            this.objectManager.setLayer(this.baseLayer);
          }
          if (this.selectionManager) {
            this.selectionManager.setupTransformer(this.baseLayer);
          }
        }
        
        if (this.selectionManager) {
          this.selectionManager.updateSelection();
        }
      }
    }
    return result;
  }

  /**
   * Checks if undo is possible
   */
  canUndo(): boolean {
    return this.historyManager.canUndo();
  }

  /**
   * Checks if redo is possible
   */
  canRedo(): boolean {
    return this.historyManager.canRedo();
  }
}
