/**
 * HistoryManager
 * Undo/Redo functionality using JSON snapshots
 */

import Konva from 'konva';

export interface HistoryEntry {
  label: string;
  snapshot: string; // JSON string from stage.toJSON()
  timestamp: number;
}

/**
 * Manages undo/redo history with JSON snapshots
 */
export class HistoryManager {
  private undoStack: HistoryEntry[] = [];
  private redoStack: HistoryEntry[] = [];
  private maxSize: number;
  private stage: Konva.Stage | null = null;

  constructor(maxSize: number = 100) {
    this.maxSize = maxSize;
  }

  /**
   * Sets the stage reference
   */
  setStage(stage: Konva.Stage): void {
    this.stage = stage;
  }

  /**
   * Gets the stage reference
   */
  getStage(): Konva.Stage | null {
    return this.stage;
  }

  /**
   * Saves current state to history
   */
  saveState(label: string): void {
    if (!this.stage) {
      throw new Error('Stage not set. Call setStage first.');
    }

    const snapshot = this.stage.toJSON();

    const entry: HistoryEntry = {
      label,
      snapshot: JSON.stringify(snapshot),
      timestamp: Date.now(),
    };

    // Add to undo stack
    this.undoStack.push(entry);

    // Limit stack size
    if (this.undoStack.length > this.maxSize) {
      this.undoStack.shift();
    }

    // Clear redo stack when new action is performed
    this.redoStack = [];
  }

  /**
   * Undoes the last action
   */
  undo(): boolean {
    if (!this.stage) {
      throw new Error('Stage not set. Call setStage first.');
    }

    if (this.undoStack.length === 0) {
      return false;
    }

    // Save current state to redo stack
    const currentSnapshot = this.stage.toJSON();
    const currentEntry: HistoryEntry = {
      label: 'Current',
      snapshot: JSON.stringify(currentSnapshot),
      timestamp: Date.now(),
    };
    this.redoStack.push(currentEntry);

    // Get previous state
    const entry = this.undoStack.pop();
    if (!entry) {
      return false;
    }

    // Restore state
    try {
      const snapshot = JSON.parse(entry.snapshot);
      const container = this.stage.container();
      const width = this.stage.width();
      const height = this.stage.height();
      
      // Konva.Stage.fromObject doesn't exist, use Node.create instead
      this.stage.destroyChildren();
      const restoredStage = Konva.Node.create(snapshot) as Konva.Stage;
      if (restoredStage) {
        restoredStage.container(container);
        restoredStage.width(width);
        restoredStage.height(height);
        restoredStage.draw();
        this.stage = restoredStage;
      } else {
        // Fallback: manually restore
        this.stage = new Konva.Stage({
          container,
          width,
          height,
        });
        // Restore layers manually if needed
        this.stage.draw();
      }
      return true;
    } catch (error) {
      console.error('Failed to restore state:', error);
      return false;
    }
  }

  /**
   * Redoes the last undone action
   */
  redo(): boolean {
    if (!this.stage) {
      throw new Error('Stage not set. Call setStage first.');
    }

    if (this.redoStack.length === 0) {
      return false;
    }

    // Save current state to undo stack
    const currentSnapshot = this.stage.toJSON();
    const currentEntry: HistoryEntry = {
      label: 'Current',
      snapshot: JSON.stringify(currentSnapshot),
      timestamp: Date.now(),
    };
    this.undoStack.push(currentEntry);

    // Get next state
    const entry = this.redoStack.pop();
    if (!entry) {
      return false;
    }

    // Restore state
    try {
      const snapshot = JSON.parse(entry.snapshot);
      const container = this.stage.container();
      const width = this.stage.width();
      const height = this.stage.height();
      
      // Konva.Stage.fromObject doesn't exist, use Node.create instead
      this.stage.destroyChildren();
      const restoredStage = Konva.Node.create(snapshot) as Konva.Stage;
      if (restoredStage) {
        restoredStage.container(container);
        restoredStage.width(width);
        restoredStage.height(height);
        restoredStage.draw();
        this.stage = restoredStage;
      } else {
        // Fallback: manually restore
        this.stage = new Konva.Stage({
          container,
          width,
          height,
        });
        // Restore layers manually if needed
        this.stage.draw();
      }
      return true;
    } catch (error) {
      console.error('Failed to restore state:', error);
      return false;
    }
  }

  /**
   * Checks if undo is possible
   */
  canUndo(): boolean {
    return this.undoStack.length > 0;
  }

  /**
   * Checks if redo is possible
   */
  canRedo(): boolean {
    return this.redoStack.length > 0;
  }

  /**
   * Clears all history
   */
  clearHistory(): void {
    this.undoStack = [];
    this.redoStack = [];
  }

  /**
   * Gets the full history
   */
  getHistory(): HistoryEntry[] {
    return [...this.undoStack];
  }

  /**
   * Gets the redo stack
   */
  getRedoStack(): HistoryEntry[] {
    return [...this.redoStack];
  }

  /**
   * Gets the current history index (for UI display)
   */
  getCurrentIndex(): number {
    return this.undoStack.length - 1;
  }

  /**
   * Sets the maximum history size
   */
  setMaxSize(size: number): void {
    this.maxSize = size;

    // Trim stacks if needed
    if (this.undoStack.length > size) {
      this.undoStack = this.undoStack.slice(-size);
    }
    if (this.redoStack.length > size) {
      this.redoStack = this.redoStack.slice(-size);
    }
  }
}
