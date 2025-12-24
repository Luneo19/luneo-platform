/**
 * Détection main - MediaPipe Hands
 */

export interface HandLandmarks {
  wrist: { x: number; y: number; z: number };
  thumb: { x: number; y: number; z: number };
  index: { x: number; y: number; z: number };
}

export class HandDetector {
  async initialize(): Promise<void> {
    // TODO: Implement MediaPipe Hands
  }
  
  detect(): HandLandmarks | null {
    // TODO: Implement detection
    return null;
  }
  
  stop(): void {
    // TODO: Cleanup
  }
}

