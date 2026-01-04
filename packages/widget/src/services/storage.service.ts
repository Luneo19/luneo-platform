import type { DesignData } from '../types/designer.types';

const STORAGE_PREFIX = 'luneo_widget_';

export class StorageService {
  private productId: string;
  
  constructor(productId: string) {
    this.productId = productId;
  }
  
  private getKey(key: string): string {
    return `${STORAGE_PREFIX}${this.productId}_${key}`;
  }
  
  saveDesign(designData: DesignData): void {
    if (typeof window === 'undefined') return;
    
    try {
      const key = this.getKey('design');
      localStorage.setItem(key, JSON.stringify(designData));
    } catch (error) {
      console.error('Failed to save design to localStorage:', error);
    }
  }
  
  loadDesign(): DesignData | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const key = this.getKey('design');
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load design from localStorage:', error);
      return null;
    }
  }
  
  clearDesign(): void {
    if (typeof window === 'undefined') return;
    
    try {
      const key = this.getKey('design');
      localStorage.removeItem(key);
    } catch (error) {
      console.error('Failed to clear design from localStorage:', error);
    }
  }
  
  saveSession(key: string, value: unknown): void {
    if (typeof window === 'undefined') return;
    
    try {
      sessionStorage.setItem(this.getKey(key), JSON.stringify(value));
    } catch (error) {
      console.error('Failed to save to sessionStorage:', error);
    }
  }
  
  loadSession<T>(key: string): T | null {
    if (typeof window === 'undefined') return null;
    
    try {
      const data = sessionStorage.getItem(this.getKey(key));
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Failed to load from sessionStorage:', error);
      return null;
    }
  }
}


