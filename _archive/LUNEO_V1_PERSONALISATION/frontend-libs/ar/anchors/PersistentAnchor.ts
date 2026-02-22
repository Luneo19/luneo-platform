/**
 * Persist anchors between sessions via IndexedDB.
 * @module ar/anchors/PersistentAnchor
 */

import { logger } from '@/lib/logger';

const DB_NAME = 'ar-persistent-anchors';
const STORE = 'anchors';

export interface StoredAnchorData {
  id: string;
  position: { x: number; y: number; z: number };
  orientation: { x: number; y: number; z: number; w: number };
  createdAt: number;
  label?: string;
}

/**
 * Save and load anchor data to IndexedDB for persistence across sessions.
 */
export class PersistentAnchor {
  private db: IDBDatabase | null = null;

  private async getDB(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        this.db = req.result;
        resolve(req.result);
      };
      req.onupgradeneeded = () => {
        req.result.createObjectStore(STORE, { keyPath: 'id' });
      };
    });
  }

  /**
   * Save anchor data (position/orientation) to IndexedDB.
   */
  async save(anchor: StoredAnchorData): Promise<void> {
    try {
      const database = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = database.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        store.put(anchor);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      logger.warn('PersistentAnchor: save failed', { error: String(err) });
    }
  }

  /**
   * Load all saved anchors from IndexedDB.
   */
  async load(): Promise<StoredAnchorData[]> {
    try {
      const database = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = database.transaction(STORE, 'readonly');
        const store = tx.objectStore(STORE);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result ?? []);
        req.onerror = () => reject(req.error);
      });
    } catch (err) {
      logger.warn('PersistentAnchor: load failed', { error: String(err) });
      return [];
    }
  }

  /**
   * Remove all saved anchors from IndexedDB.
   */
  async clear(): Promise<void> {
    try {
      const database = await this.getDB();
      return new Promise((resolve, reject) => {
        const tx = database.transaction(STORE, 'readwrite');
        const store = tx.objectStore(STORE);
        store.clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error);
      });
    } catch (err) {
      logger.warn('PersistentAnchor: clear failed', { error: String(err) });
    }
  }

  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
    }
  }
}
