/**
 * @luneo/virtual-try-on - Performance Monitor professionnel
 * Monitoring FPS, frame time, memory
 */

import type { PerformanceMetrics } from '../core/types';

/**
 * Configuration du performance monitor
 */
export interface PerformanceMonitorConfig {
  /** Taille de l'échantillon pour moyennes */
  sampleSize?: number;
  
  /** Seuil d'alerte FPS */
  warningThreshold?: number;
  
  /** Seuil critique FPS */
  criticalThreshold?: number;
  
  /** Activer memory monitoring */
  trackMemory?: boolean;
}

/**
 * Performance Monitor professionnel
 * 
 * Features:
 * - FPS monitoring temps réel
 * - Frame time measurement
 * - Memory usage tracking
 * - Moving average
 * - Alertes de performance
 * 
 * @example
 * ```typescript
 * const monitor = new PerformanceMonitor({
 *   sampleSize: 60,
 *   warningThreshold: 30,
 *   criticalThreshold: 15
 * });
 * 
 * // Dans render loop
 * monitor.startFrame();
 * // ... render logic ...
 * monitor.endFrame();
 * 
 * const metrics = monitor.getMetrics();
 * console.log(`FPS: ${metrics.averageFPS}`);
 * ```
 */
export class PerformanceMonitor {
  private config: Required<PerformanceMonitorConfig>;
  
  // Frame timing
  private frameStartTime: number = 0;
  private lastFrameTime: number = 0;
  private frameTimes: number[] = [];
  private framesRendered: number = 0;
  
  // FPS calculation
  private fpsHistory: number[] = [];
  private lastFPSUpdate: number = 0;
  private fpsUpdateInterval: number = 1000; // 1 seconde
  
  // Performance stats
  private minFPS: number = Infinity;
  private maxFPS: number = 0;

  constructor(config: PerformanceMonitorConfig = {}) {
    this.config = {
      sampleSize: config.sampleSize || 60,
      warningThreshold: config.warningThreshold || 30,
      criticalThreshold: config.criticalThreshold || 15,
      trackMemory: config.trackMemory !== false, // Default true
    };
    
    this.lastFPSUpdate = performance.now();
  }

  /**
   * Marque le début d'une frame
   */
  startFrame(): void {
    this.frameStartTime = performance.now();
  }

  /**
   * Marque la fin d'une frame et calcule les métriques
   */
  endFrame(): void {
    const now = performance.now();
    const frameTime = now - this.frameStartTime;
    
    // Stocker frame time
    this.frameTimes.push(frameTime);
    if (this.frameTimes.length > this.config.sampleSize) {
      this.frameTimes.shift();
    }
    
    // Calculer FPS si 1 seconde écoulée
    if (now - this.lastFPSUpdate >= this.fpsUpdateInterval) {
      const deltaTime = (now - this.lastFPSUpdate) / 1000; // En secondes
      // Utiliser le nombre de frames dans frameTimes au lieu de framesRendered total
      const framesInInterval = this.frameTimes.length;
      const currentFPS = framesInInterval > 0 && deltaTime > 0 
        ? Math.round(framesInInterval / deltaTime)
        : 0;
      
      if (currentFPS > 0) {
        this.fpsHistory.push(currentFPS);
        if (this.fpsHistory.length > this.config.sampleSize) {
          this.fpsHistory.shift();
        }
        
        // Update min/max
        if (this.minFPS === Infinity) {
          this.minFPS = currentFPS;
        } else {
          this.minFPS = Math.min(this.minFPS, currentFPS);
        }
        this.maxFPS = Math.max(this.maxFPS, currentFPS);
      }
      
      this.lastFPSUpdate = now;
    }
    
    this.framesRendered++;
    this.lastFrameTime = now;
  }

  /**
   * Obtient les métriques actuelles
   */
  getMetrics(): PerformanceMetrics {
    const averageFPS = this.calculateAverageFPS();
    const averageFrameTime = this.calculateAverageFrameTime();
    
    return {
      averageFPS,
      minFPS: this.minFPS === Infinity ? 0 : this.minFPS,
      maxFPS: this.maxFPS,
      averageFrameTime,
      memoryUsage: this.config.trackMemory ? this.getMemoryUsage() : 0,
      framesRendered: this.framesRendered,
    };
  }

  /**
   * Vérifie si les performances sont bonnes
   */
  isPerformanceGood(): boolean {
    const fps = this.calculateAverageFPS();
    return fps >= this.config.warningThreshold;
  }

  /**
   * Vérifie si les performances sont critiques
   */
  isPerformanceCritical(): boolean {
    const fps = this.calculateAverageFPS();
    return fps < this.config.criticalThreshold;
  }

  /**
   * Obtient le niveau de performance
   */
  getPerformanceLevel(): 'good' | 'warning' | 'critical' {
    const fps = this.calculateAverageFPS();
    
    if (fps >= this.config.warningThreshold) {
      return 'good';
    } else if (fps >= this.config.criticalThreshold) {
      return 'warning';
    } else {
      return 'critical';
    }
  }

  /**
   * Réinitialise les statistiques
   */
  reset(): void {
    this.frameTimes = [];
    this.fpsHistory = [];
    this.framesRendered = 0;
    this.minFPS = Infinity;
    this.maxFPS = 0;
    this.lastFPSUpdate = performance.now();
  }

  /**
   * Obtient des recommandations basées sur les performances
   */
  getRecommendations(): string[] {
    const level = this.getPerformanceLevel();
    const recommendations: string[] = [];
    
    if (level === 'warning') {
      recommendations.push('Performances moyennes détectées');
      recommendations.push('Fermez les autres applications');
      recommendations.push('Réduisez la résolution de la caméra');
    } else if (level === 'critical') {
      recommendations.push('⚠️ Performances critiques !');
      recommendations.push('Utilisez un appareil plus puissant');
      recommendations.push('Fermez toutes les autres applications');
      recommendations.push('Désactivez les effets 3D avancés');
    } else {
      recommendations.push('✅ Performances excellentes');
    }
    
    return recommendations;
  }

  /**
   * Calcule le FPS moyen
   */
  private calculateAverageFPS(): number {
    if (this.fpsHistory.length === 0) {
      return 0;
    }
    
    const sum = this.fpsHistory.reduce((acc, fps) => acc + fps, 0);
    return Math.round(sum / this.fpsHistory.length);
  }

  /**
   * Calcule le frame time moyen (ms)
   */
  private calculateAverageFrameTime(): number {
    if (this.frameTimes.length === 0) {
      return 0;
    }
    
    const sum = this.frameTimes.reduce((acc, time) => acc + time, 0);
    return sum / this.frameTimes.length;
  }

  /**
   * Obtient l'utilisation mémoire (MB)
   */
  private getMemoryUsage(): number {
    if ('memory' in performance && (performance as any).memory) {
      const memory = (performance as any).memory;
      return Math.round(memory.usedJSHeapSize / 1024 / 1024);
    }
    return 0;
  }

  /**
   * Formate les métriques pour affichage
   */
  formatMetrics(metrics: PerformanceMetrics): string {
    return `
FPS: ${metrics.averageFPS} (min: ${metrics.minFPS}, max: ${metrics.maxFPS})
Frame Time: ${metrics.averageFrameTime.toFixed(2)}ms
Memory: ${metrics.memoryUsage}MB
Frames: ${metrics.framesRendered}
    `.trim();
  }
}

